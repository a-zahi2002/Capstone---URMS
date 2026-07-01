const request = require('supertest');
const app = require('../../backend/dist/app').default;

describe('Security: Infrastructure & Headers', () => {
  
  describe('Rate Limiting', () => {
    const loginRoute = '/api/login'; // Example of a rate-limited route

    it('should return 429 Too Many Requests when rate limit is exceeded', async () => {
      // Configuration for express-rate-limit should be tight for testing or 
      // you will need to loop enough times to hit the standard limit (e.g., 100 requests).
      // Here we assume a typical limit of say, 50 requests per window for the login endpoint.
      // We will loop 101 times just to be safe in a test environment.
      
      const REQUEST_LIMIT = 100; 
      let lastResponse;

      // Fire rapid consecutive requests
      for (let i = 0; i <= REQUEST_LIMIT; i++) {
        lastResponse = await request(app)
          .post(loginRoute)
          .send({ email: 'test@urms.test', password: 'password123' });
          
        if (lastResponse.status === 429) {
          break;
        }
      }

      expect(lastResponse.status).toBe(429);
      // Some middlewares send text like "Too many requests"
      // expect(lastResponse.text).toMatch(/Too many requests/i);
    });
  });

  describe('Security Headers (Helmet)', () => {
    const sampleRoute = '/api/health'; // Or any generic accessible route

    it('should include Strict-Transport-Security header', async () => {
      const response = await request(app).get(sampleRoute);

      // Check for the HSTS header injected by helmet
      expect(response.headers).toHaveProperty('strict-transport-security');
      // Verify standard helmet HSTS configuration (e.g., max-age=15552000)
      expect(response.headers['strict-transport-security']).toContain('max-age=');
    });

    it('should include basic security headers like X-Content-Type-Options', async () => {
      const response = await request(app).get(sampleRoute);

      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
    });
  });
});
