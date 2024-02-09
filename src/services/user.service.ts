import { redis } from '../utils/redis';

// get user by id
export const getUserById = async (id: string) => {
  const userJson = await redis.get(id);

  if (!userJson) return null;

  const user = JSON.parse(userJson);

  return user;
};
