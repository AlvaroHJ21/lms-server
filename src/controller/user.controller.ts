import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';

import UserModel, { IUser } from '../models/user.model';

import { ErrorHandler } from '../utils/ErrorHandler';
import sendMail from '../utils/sendMail';
import { catchAsyncError } from '../middleware/catchAsyncErrors';
import { accessTokenOptions, refreshTokenOptions, sendToken } from '../utils/jwt';
import { redis } from '../utils/redis';
import { getUserById } from '../services/user.service';
import cloudinary from 'cloudinary';

// register user
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registrationUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, avatar } = req.body as IRegistrationBody;

      // validar email y password

      if (!name || !email || !password) {
        return next(new ErrorHandler(400, 'Please fill in all fields'));
      }

      const isEmailExist = await UserModel.findOne({ email });

      if (isEmailExist) {
        return next(new ErrorHandler(400, 'Email already exists'));
      }

      const user: IRegistrationBody = {
        name,
        email,
        password,
      };

      const activationToken = createActivationToken(user);

      const { activationCode } = activationToken;

      const data = { user, activationCode };

      try {
        await sendMail({
          email: user.email,
          subject: 'Account Activation',
          template: 'activation-mail.ejs',
          data,
        });

        // const newUser = await userModel.create(user);
        // await newUser.save();

        res.status(201).json({
          success: true,
          message: 'Please check your email to activate your account',
          activationToken: activationToken.token,
        });
      } catch (error: any) {
        return next(new ErrorHandler(500, error.message));
      }
    } catch (error: any) {
      next(new ErrorHandler(400, error.message));
    }
  }
);

interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: '5m',
    }
  );

  return { token, activationCode };
};

// activate user

interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const activateUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_token, activation_code } = req.body as IActivationRequest;

      const decoded = jwt.verify(activation_token, process.env.ACTIVATION_SECRET as string) as {
        user: IUser;
        activationCode: string;
      };

      if (activation_code != decoded.activationCode) {
        return next(new ErrorHandler(400, 'Invalid activation code'));
      }

      const { name, email, password } = decoded.user;

      const existUser = await UserModel.findOne({ email });

      if (existUser) {
        return next(new ErrorHandler(400, 'User already exists'));
      }

      await UserModel.create({
        name,
        email,
        password,
        isVerified: true,
      });

      res.status(201).json({
        success: true,
      });
    } catch (error: any) {
      next(new ErrorHandler(400, error.message));
    }
  }
);

// login user

interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;

      if (!email || !password) {
        return next(new ErrorHandler(400, 'Please enter email and password'));
      }

      const user = await UserModel.findOne({ email });

      if (!user) {
        return next(new ErrorHandler(400, 'User not found'));
      }

      // console.log(user);

      const isPasswordMatch = await user.comparePassword(password);

      if (!isPasswordMatch) {
        return next(new ErrorHandler(400, 'Invalid password'));
      }

      sendToken(user, 200, res);
    } catch (error: any) {
      next(new ErrorHandler(400, error.message));
    }
  }
);

// logout user
export const logoutUser = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie('access_token', '', { maxAge: 1 });
      res.cookie('refresh_token', '', { maxAge: 1 });

      redis.del(req.user._id);

      res.status(200).json({
        success: true,
        message: 'Logged out',
      });
    } catch (error: any) {
      return next(new ErrorHandler(500, error.message));
    }
  }
);

// update access token
export const updateAccessToken = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refresh_token } = req.cookies;

      const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload;

      const message = 'Could not regresh token';
      if (!decoded) {
        return next(new ErrorHandler(400, message));
      }

      const session = await redis.get(decoded.id);

      if (!session) {
        return next(new ErrorHandler(400, message));
      }

      const user = JSON.parse(session);

      const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN as string, {
        expiresIn: '5m',
      });

      // req.user = user;

      const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN as string, {
        expiresIn: '3d',
      });

      res.cookie('access_token', accessToken, accessTokenOptions);
      res.cookie('refresh_token', refreshToken, refreshTokenOptions);

      res.status(200).json({
        success: true,
        accessToken,
      });
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message));
    }
  }
);

// get user info

export const getUserInfo = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await getUserById(req.user._id);

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message));
    }
  }
);

// social auth
interface ISocialAuthRequest {
  email: string;
  name: string;
  avatar: {
    url: string;
    public_id: string;
  };
}
export const socialAuth = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as ISocialAuthRequest;

      const user = await UserModel.findOne({ email });

      if (!user) {
        const newUser = await UserModel.create({
          name,
          email,
          avatar,
        });

        sendToken(newUser, 200, res);
      } else {
        sendToken(user, 200, res);
      }
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message));
    }
  }
);

// update user info

interface IUpdateUserInfo {
  name?: string;
  email?: string;
}

export const updateUserInfo = catchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name } = req.body as IUpdateUserInfo;

      const userId = req.user._id;

      const user = await UserModel.findById(userId);

      if (!user) return next(new ErrorHandler(400, 'User not found'));

      if (email) {
        if (email === user.email) return next(new ErrorHandler(400, 'Same email address'));

        const isEmalExist = await UserModel.findOne({ email });

        if (isEmalExist) return next(new ErrorHandler(400, 'Email already exists'));

        user.email = email;
      }

      if (name) {
        user.name = name;
      }

      await user.save();

      await redis.set(userId, JSON.stringify(user));

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error: any) {
      return next(new ErrorHandler(400, error.message));
    }
  }
);

// update user password
interface IUpdatePassword {
  oldPassword: string;
  newPassword: string;
}

export const updatePassword = catchAsyncError(async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body as IUpdatePassword;
    const user = req.user;

    if (!oldPassword || !newPassword)
      return next(new ErrorHandler(400, 'Please enter old and new password'));

    const userDB = await UserModel.findById(user._id);

    if (!userDB) return next(new ErrorHandler(400, 'User not found'));

    const isPasswordMatch = await userDB.comparePassword(oldPassword);

    if (!isPasswordMatch) return next(new ErrorHandler(400, 'Invalid password'));

    userDB.password = newPassword;

    await userDB.save();

    res.status(200).json({
      success: isPasswordMatch,
      data: userDB,
    });
  } catch (error: any) {
    return next(new ErrorHandler(400, error.message));
  }
});

//update profile picture
interface IUpdatreProfilePicture {
  avatar: string;
}

export const updateProfilepicture = catchAsyncError(async (req, res, next) => {
  try {
    const { avatar } = req.body as IUpdatreProfilePicture;

    if (!avatar) return next(new ErrorHandler(400, 'Please upload an image'));

    const user = await UserModel.findById(req.user._id);

    if (!user) return next(new ErrorHandler(400, 'User not found'));

    if (user.avatar?.public_id) {
      await cloudinary.v2.uploader.destroy(user.avatar.public_id);
    }

    const myCloud = await cloudinary.v2.uploader.upload(avatar, {
      folder: 'avatars',
      width: 150,
    });

    user.avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };

    user.save();

    redis.set(req.user._id, JSON.stringify(user));

    res.status(200).json({
      success: true,
      data: user,
    });

  } catch (error: any) {
    return next(new ErrorHandler(400, error.message));
  }
});
