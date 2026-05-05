import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import React from 'react';
import { Resend } from 'resend';
import { User, UserModel } from '../models/user.model';
import VerificationEmail from '../emails/VerificationEmail';

const resend = new Resend(process.env.RESEND_API_KEY);
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const UserService = {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  },

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  generateToken(user: Partial<User>): string {
    // Payload: user_id and email only (Section 5)
    return jwt.sign(
      { user_id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '15m' } // Section 9
    );
  },

  async registerUser(data: { name: string; username: string; email: string; password: string; phone: string }) {
    const existingEmail = await UserModel.findByEmail(data.email);
    if (existingEmail) throw new Error('Email already registered');

    const existingUsername = await UserModel.findByUsername(data.username);
    if (existingUsername) throw new Error('Username already taken');

    const passwordHash = await this.hashPassword(data.password);

    const user = await UserModel.create({
      name: data.name,
      username: data.username,
      email: data.email,
      password_hash: passwordHash,
      phone: data.phone,
      provider: 'local',
      is_verified: false
    });

    // Generate and send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit numeric
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await UserModel.createOTP(user.id, otp, expiresAt);

    // Send email via Resend
    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev', // Default testing sender
        to: user.email,
        subject: 'Verify your account',
        react: React.createElement(VerificationEmail, {
          username: data.username,
          otp: otp
        }) as React.ReactElement
      });
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      // We don't throw here to allow user to try resend-otp
    }

    return user;
  },

  async verifyOTP(email: string, otp: string) {
    const user = await UserModel.findByEmail(email);
    if (!user) throw new Error('User not found');

    const latestOtp = await UserModel.findLatestOTP(user.id);

    if (!latestOtp || latestOtp.otp !== otp) {
      throw new Error('Invalid OTP');
    }

    if (new Date() > latestOtp.expires_at) {
      throw new Error('OTP expired');
    }

    await UserModel.update(user.id, { is_verified: true });
    await UserModel.markOTPUsed(latestOtp.id);

    return true;
  },

  async loginUser(email: string, password: string) {
    const user = await UserModel.findByEmail(email);
    if (!user) throw new Error('Invalid credentials');

    if (user.provider !== 'local' || !user.password_hash) {
      throw new Error('Please login with Google');
    }

    const isValid = await this.comparePassword(password, user.password_hash);
    if (!isValid) throw new Error('Invalid credentials');

    if (!user.is_verified) {
      throw new Error('Account not verified. Please verify your OTP.');
    }

    const token = this.generateToken(user);
    return { user, token };
  },

  async loginWithGoogle(profile: { name: string; email: string; image?: string }) {
    let user = await UserModel.findByEmail(profile.email);

    if (user) {
      // Update name + image if user exists (Section 3)
      user = await UserModel.update(user.id, {
        name: profile.name,
        profile_image: profile.image || user.profile_image
      });
    } else {
      // Create new user (Section 3)
      user = await UserModel.create({
        name: profile.name,
        email: profile.email,
        profile_image: profile.image,
        provider: 'google',
        is_verified: true // Google users verified = true (Section 2)
      });
    }

    const token = this.generateToken(user!);
    return { user: user!, token };
  }
};
