import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User, UserCreateData, UserData, UserLoginData } from '../models/User';
import { Pool } from 'pg';
import { logger } from '../utils/logger';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: Omit<UserData, 'password_hash'>;
  tokens: AuthTokens;
}

export class AuthService {
  private userModel: User;

  constructor(pool: Pool) {
    this.userModel = new User(pool);
  }

  /**
   * Register a new user
   */
  async register(userData: UserCreateData): Promise<AuthResult> {
    try {
      logger.info(`Attempting to register user: ${userData.email}`);

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new Error('Format d\'email invalide');
      }

      // Validate password strength
      if (userData.password.length < 8) {
        throw new Error('Le mot de passe doit contenir au moins 8 caractères');
      }

      // Create user in database
      const user = await this.userModel.create(userData);
      logger.info(`User created successfully: ${user.id}`);

      // Generate tokens
      const tokens = this.generateTokens(user);

      return {
        user,
        tokens
      };
    } catch (error: any) {
      logger.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(loginData: UserLoginData): Promise<AuthResult> {
    try {
      logger.info(`Attempting to login user: ${loginData.email}`);

      // Authenticate user
      const user = await this.userModel.authenticate(loginData.email, loginData.password);
      
      if (!user) {
        throw new Error('Email ou mot de passe incorrect');
      }

      logger.info(`User logged in successfully: ${user.id}`);

      // Generate tokens
      const tokens = this.generateTokens(user);

      return {
        user,
        tokens
      };
    } catch (error: any) {
      logger.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.security.jwt.refreshSecret) as any;
      
      // Get user from database
      const user = await this.userModel.findById(decoded.userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Generate new tokens
      return this.generateTokens(user);
    } catch (error: any) {
      logger.error('Token refresh failed:', error);
      throw new Error('Token de rafraîchissement invalide');
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<UserData | null> {
    try {
      return await this.userModel.findById(userId);
    } catch (error: any) {
      logger.error('Get profile failed:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: Partial<UserData>): Promise<UserData | null> {
    try {
      // Only allow updating certain fields
      const allowedFields = ['preferences', 'departure_airport', 'secondary_airports'];
      const filteredData: any = {};
      
      for (const field of allowedFields) {
        if (updateData[field as keyof UserData] !== undefined) {
          filteredData[field] = updateData[field as keyof UserData];
        }
      }

      if (filteredData.preferences) {
        return await this.userModel.updatePreferences(userId, filteredData.preferences);
      }

      // For other fields, we'd need additional methods in the User model
      return await this.userModel.findById(userId);
    } catch (error: any) {
      logger.error('Update profile failed:', error);
      throw error;
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, config.security.jwt.secret);
    } catch (error) {
      throw new Error('Token invalide');
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private generateTokens(user: UserData): AuthTokens {
    const payload = {
      userId: user.id,
      email: user.email,
      status: user.status,
      role: user.status === 'free' ? 'user' : 'premium_user'
    };

    const accessToken = jwt.sign(payload, config.security.jwt.secret, {
      expiresIn: config.security.jwt.expiresIn
    });

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.security.jwt.refreshSecret,
      { expiresIn: config.security.jwt.refreshExpiresIn }
    );

    return {
      accessToken,
      refreshToken
    };
  }

  /**
   * Validate token and get user data
   */
  async validateTokenAndGetUser(token: string): Promise<UserData | null> {
    try {
      const decoded = this.verifyToken(token);
      return await this.userModel.findById(decoded.userId);
    } catch (error) {
      return null;
    }
  }
}
