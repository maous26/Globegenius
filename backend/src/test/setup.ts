import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-min-32-characters-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-ok';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/globegenius_test';
process.env.REDIS_URL = 'redis://localhost:6379';

// Mock external services
jest.mock('../services/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
  },
}));

jest.mock('../database/connection', () => ({
  pool: {
    query: jest.fn(),
    end: jest.fn(),
  },
}));

// Global test timeout
jest.setTimeout(10000);

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});
