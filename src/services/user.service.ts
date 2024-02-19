import UserModel from '../models/user.model';
import { redis } from '../utils/redis';

// get user by id
export const getUserById = async (id: string) => {
  const userJson = await redis.get(id);

  if (!userJson) return null;

  const user = JSON.parse(userJson);

  return user;
};

// get all users
export const getAllUserService = async () => {
  const users = await UserModel.find().sort({
    createdAt: -1, // latest user first
  });

  return users;
};

// update user role
export const updateUserRoleService = async (id: string, role: string) => {
  const user = await UserModel.findByIdAndUpdate(
    id,
    {
      role: role,
    },
    { new: true }
  );

  return user;
};
