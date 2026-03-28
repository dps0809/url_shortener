import { createUser, findUserByEmail, disableUser as disableUserModel } from '../models/user.model';
import bcrypt from 'bcryptjs';

export const registerUser = async (email: string, passwordPlain: string) => {
  const existing = await findUserByEmail(email);
  if (existing) throw new Error('User already exists');
  
  const passwordHash = await bcrypt.hash(passwordPlain, 10);
  return await createUser(email, passwordHash);
};

export const loginUser = async (email: string, passwordPlain: string) => {
  const user = await findUserByEmail(email);
  if (!user) throw new Error('Invalid credentials');
  if (!user.is_active) throw new Error('User is disabled');
  
  const isValid = await bcrypt.compare(passwordPlain, user.password_hash);
  if (!isValid) throw new Error('Invalid credentials');
  
  return user;
};

export const getUserByEmail = async (email: string) => {
  return await findUserByEmail(email);
};

export const disableUser = async (id: number) => {
  return await disableUserModel(id);
};
