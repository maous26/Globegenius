import { Pool, QueryResult } from 'pg';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface UserCreateData {
  email: string;
  password: string;
  departureAirport?: string;
  status?: 'free' | 'essential' | 'premium' | 'premium_plus';
}

export interface UserData {
  id: string;
  email: string;
  email_verified: boolean;
  status: 'free' | 'essential' | 'premium' | 'premium_plus';
  departure_airport?: string;
  secondary_airports: string[];
  preferences: any;
  ml_profile: any;
  subscription_started_at?: Date;
  subscription_ends_at?: Date;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface UserLoginData {
  email: string;
  password: string;
}

export class User {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create a new user
   */
  async create(userData: UserCreateData): Promise<UserData> {
    const { email, password, departureAirport, status = 'free' } = userData;
    
    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    const id = uuidv4();
    
    const query = `
      INSERT INTO users (
        id, email, password_hash, status, departure_airport, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING 
        id, email, email_verified, status, departure_airport, secondary_airports,
        preferences, ml_profile, subscription_started_at, subscription_ends_at,
        last_login_at, created_at, updated_at
    `;
    
    try {
      const result: QueryResult<UserData> = await this.pool.query(query, [
        id,
        email,
        password_hash,
        status,
        departureAirport || null
      ]);
      
      return result.rows[0];
    } catch (error: any) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Un utilisateur avec cet email existe déjà');
      }
      throw error;
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserData | null> {
    const query = `
      SELECT 
        id, email, email_verified, status, departure_airport, secondary_airports,
        preferences, ml_profile, subscription_started_at, subscription_ends_at,
        last_login_at, created_at, updated_at
      FROM users 
      WHERE email = $1
    `;
    
    const result: QueryResult<UserData> = await this.pool.query(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<UserData | null> {
    const query = `
      SELECT 
        id, email, email_verified, status, departure_airport, secondary_airports,
        preferences, ml_profile, subscription_started_at, subscription_ends_at,
        last_login_at, created_at, updated_at
      FROM users 
      WHERE id = $1
    `;
    
    const result: QueryResult<UserData> = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Authenticate user
   */
  async authenticate(email: string, password: string): Promise<UserData | null> {
    const query = `
      SELECT 
        id, email, email_verified, status, departure_airport, secondary_airports,
        preferences, ml_profile, subscription_started_at, subscription_ends_at,
        last_login_at, created_at, updated_at, password_hash
      FROM users 
      WHERE email = $1
    `;
    
    const result = await this.pool.query(query, [email]);
    const user = result.rows[0];
    
    if (!user) {
      return null;
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return null;
    }
    
    // Update last login
    await this.updateLastLogin(user.id);
    
    // Return user data without password hash
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    const query = `
      UPDATE users 
      SET last_login_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `;
    
    await this.pool.query(query, [id]);
  }

  /**
   * Update user preferences
   */
  async updatePreferences(id: string, preferences: any): Promise<UserData | null> {
    const query = `
      UPDATE users 
      SET preferences = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING 
        id, email, email_verified, status, departure_airport, secondary_airports,
        preferences, ml_profile, subscription_started_at, subscription_ends_at,
        last_login_at, created_at, updated_at
    `;
    
    const result: QueryResult<UserData> = await this.pool.query(query, [id, preferences]);
    return result.rows[0] || null;
  }

  /**
   * Update user status (subscription)
   */
  async updateStatus(id: string, status: 'free' | 'essential' | 'premium' | 'premium_plus'): Promise<UserData | null> {
    const query = `
      UPDATE users 
      SET status = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING 
        id, email, email_verified, status, departure_airport, secondary_airports,
        preferences, ml_profile, subscription_started_at, subscription_ends_at,
        last_login_at, created_at, updated_at
    `;
    
    const result: QueryResult<UserData> = await this.pool.query(query, [id, status]);
    return result.rows[0] || null;
  }

  /**
   * Verify email
   */
  async verifyEmail(id: string): Promise<void> {
    const query = `
      UPDATE users 
      SET email_verified = TRUE, updated_at = NOW()
      WHERE id = $1
    `;
    
    await this.pool.query(query, [id]);
  }

  /**
   * Get user statistics
   */
  async getStats(): Promise<{
    total: number;
    free: number;
    premium: number;
    verified: number;
    activeToday: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'free' THEN 1 END) as free,
        COUNT(CASE WHEN status IN ('essential', 'premium', 'premium_plus') THEN 1 END) as premium,
        COUNT(CASE WHEN email_verified = TRUE THEN 1 END) as verified,
        COUNT(CASE WHEN last_login_at >= NOW() - INTERVAL '1 day' THEN 1 END) as active_today
      FROM users
    `;
    
    const result = await this.pool.query(query);
    const stats = result.rows[0];
    
    return {
      total: parseInt(stats.total),
      free: parseInt(stats.free),
      premium: parseInt(stats.premium),
      verified: parseInt(stats.verified),
      activeToday: parseInt(stats.active_today)
    };
  }
}
