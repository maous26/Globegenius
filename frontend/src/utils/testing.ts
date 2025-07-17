/**
 * Testing utilities and helpers
 */

// Test data factories
export const testDataFactories = {
  /**
   * Create mock user data
   */
  createUser: (overrides: Partial<any> = {}) => ({
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  /**
   * Create mock alert data
   */
  createAlert: (overrides: Partial<any> = {}) => ({
    id: '1',
    userId: '1',
    origin: 'CDG',
    destination: 'JFK',
    departureDate: new Date(),
    maxPrice: 500,
    currency: 'EUR',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }),

  /**
   * Create mock price data
   */
  createPrice: (overrides: Partial<any> = {}) => ({
    id: '1',
    origin: 'CDG',
    destination: 'JFK',
    departureDate: new Date(),
    price: 450,
    currency: 'EUR',
    airline: 'Air France',
    flightNumber: 'AF123',
    departureTime: new Date(),
    arrivalTime: new Date(),
    source: 'test',
    scrapedAt: new Date(),
    ...overrides,
  }),

  /**
   * Create mock preferences data
   */
  createPreferences: (overrides: Partial<any> = {}) => ({
    id: '1',
    userId: '1',
    departureAirports: ['CDG'],
    maxBudget: 1000,
    alertFrequency: 'daily',
    timezone: 'Europe/Paris',
    currency: 'EUR',
    language: 'fr',
    notificationChannels: {
      email: true,
      sms: false,
      push: true,
    },
    ...overrides,
  }),
};

// Mock API responses
export const mockApiResponses = {
  /**
   * Success response
   */
  success: <T>(data: T) => ({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  }),

  /**
   * Error response
   */
  error: (message: string, statusCode = 400) => ({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    statusCode,
  }),

  /**
   * Paginated response
   */
  paginated: <T>(data: T[], page = 1, limit = 20, total = data.length) => ({
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    timestamp: new Date().toISOString(),
  }),
};

// Test utilities
export const testUtils = {
  /**
   * Wait for async operations
   */
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Mock localStorage
   */
  mockLocalStorage: () => {
    const store: Record<string, string> = {};
    
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach(key => delete store[key]);
      },
      store,
    };
  },

  /**
   * Mock sessionStorage
   */
  mockSessionStorage: () => {
    return testUtils.mockLocalStorage();
  },

  /**
   * Mock fetch
   */
  mockFetch: (responses: Array<{ url: string; response: any; status?: number }>) => {
    const mockFetch = jest.fn();
    
    responses.forEach(({ url, response, status = 200 }) => {
      mockFetch.mockImplementationOnce((requestUrl: string) => {
        if (requestUrl.includes(url)) {
          return Promise.resolve({
            ok: status < 400,
            status,
            json: () => Promise.resolve(response),
            text: () => Promise.resolve(JSON.stringify(response)),
          });
        }
        return Promise.reject(new Error(`Unexpected request to ${requestUrl}`));
      });
    });
    
    return mockFetch;
  },

  /**
   * Mock IntersectionObserver
   */
  mockIntersectionObserver: () => {
    const mockObserver = {
      observe: jest.fn(),
      disconnect: jest.fn(),
      unobserve: jest.fn(),
    };
    
    (window as any).IntersectionObserver = jest.fn().mockImplementation(() => mockObserver);
    return mockObserver;
  },

  /**
   * Mock ResizeObserver
   */
  mockResizeObserver: () => {
    const mockObserver = {
      observe: jest.fn(),
      disconnect: jest.fn(),
      unobserve: jest.fn(),
    };
    
    (window as any).ResizeObserver = jest.fn().mockImplementation(() => mockObserver);
    return mockObserver;
  },

  /**
   * Mock window methods
   */
  mockWindow: (overrides: Partial<Window> = {}) => {
    const originalWindow = { ...window };
    
    Object.assign(window, overrides);
    
    return () => {
      Object.assign(window, originalWindow);
    };
  },
};

// Test setup helpers
export const testSetup = {
  /**
   * Setup test environment
   */
  setupTestEnvironment: () => {
    // Mock console methods in tests
    const originalConsole = { ...console };
    console.warn = jest.fn();
    console.error = jest.fn();
    
    // Mock window methods
    testUtils.mockIntersectionObserver();
    testUtils.mockResizeObserver();
    
    // Mock localStorage
    const mockStorage = testUtils.mockLocalStorage();
    Object.defineProperty(window, 'localStorage', { value: mockStorage });
    Object.defineProperty(window, 'sessionStorage', { value: mockStorage });
    
    // Cleanup function
    return () => {
      Object.assign(console, originalConsole);
      jest.clearAllMocks();
    };
  },

  /**
   * Setup API test
   */
  setupApiTest: (responses: Array<{ url: string; response: any; status?: number }>) => {
    const mockFetch = testUtils.mockFetch(responses);
    global.fetch = mockFetch;
    
    return { mockFetch };
  },
};

// Performance testing utilities
export const performanceTestUtils = {
  /**
   * Measure component render time
   */
  measureRenderTime: async (renderFunction: () => void, iterations = 100) => {
    const times: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      renderFunction();
      const end = performance.now();
      times.push(end - start);
    }
    
    const average = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    return { average, min, max, times };
  },

  /**
   * Test memory usage
   */
  testMemoryUsage: (testFunction: () => void) => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    testFunction();
    
    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }
    
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryDelta = finalMemory - initialMemory;
    
    return { initialMemory, finalMemory, memoryDelta };
  },
};

// Export all utilities
export default {
  testDataFactories,
  mockApiResponses,
  testUtils,
  testSetup,
  performanceTestUtils,
};
