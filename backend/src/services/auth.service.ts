import { checkRateLimit } from '../middleware/rateLimit.middleware';

export class AuthService {
  /**
   * Example integration of Rate Limit in the service layer if needed
   * outside of middleware context.
   */
  static async enforceRateLimit(userId: string, action: 'create' | 'redirect') {
    const errorResponse = await checkRateLimit(userId, action);
    if (errorResponse) {
      const data = await errorResponse.json();
      throw new Error(`Rate limit exceeded: ${data.error}`);
    }
  }
}
