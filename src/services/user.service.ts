import UserModel from '../models/user.model';
import { redis } from '../utils/redis';

// get user by id
export const getUserById = async (id: string) => {
  const userJson = await redis.get(id);

  if (!userJson) return null;

  const user = JSON.parse(userJson);

  return user;
};

export const getAllUserService = async () => {
  const users = await UserModel.find().sort({
    createdAt: -1, // latest user first
  });

  return users;
};
