import { query } from '@/backend/src/utils/db';

export interface User {
  id: number;
  name: string;
  email: string;
  username: string | null;
  password_hash: string | null;
  phone: string | null;
  profile_image: string | null;
  provider: 'google' | 'local';
  is_verified: boolean;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export interface OTPVerification {
  id: number;
  user_id: number;
  otp: string;
  expires_at: Date;
  is_used: boolean;
}

export const UserModel = {
  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return rows[0] || null;
  },

  async findByUsername(username: string): Promise<User | null> {
    const { rows } = await query<User>(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return rows[0] || null;
  },

  async findById(id: number): Promise<User | null> {
    const { rows } = await query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async create(data: Partial<User>): Promise<User> {
    const {
      name,
      email,
      username,
      password_hash,
      phone,
      provider = 'local',
      is_verified = false,
    } = data;

    if (!email) throw new Error('Email is required for user creation');

    const { rows } = await query<User>(
      `INSERT INTO users (name, email, username, password_hash, phone, provider, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, email.toLowerCase(), username, password_hash, phone, provider, is_verified]
    );
    return rows[0];
  },

  async update(id: number, data: Partial<User>): Promise<User | null> {
    const fields = Object.keys(data).filter(f => data[f as keyof User] !== undefined);
    if (fields.length === 0) return null;

    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = fields.map(f => data[f as keyof User]);

    const { rows } = await query<User>(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return rows[0] || null;
  },

  // OTP Methods
  async createOTP(userId: number, otp: string, expiresAt: Date): Promise<OTPVerification> {
    const { rows } = await query<OTPVerification>(
      `INSERT INTO otp_verifications (user_id, otp, expires_at)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, otp, expiresAt]
    );
    return rows[0];
  },

  async findLatestOTP(userId: number): Promise<OTPVerification | null> {
    const { rows } = await query<OTPVerification>(
      `SELECT * FROM otp_verifications 
       WHERE user_id = $1 AND is_used = false 
       ORDER BY expires_at DESC LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  },

  async markOTPUsed(otpId: number): Promise<void> {
    await query('UPDATE otp_verifications SET is_used = true WHERE id = $1', [otpId]);
  }
};
