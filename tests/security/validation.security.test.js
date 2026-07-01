const request = require('supertest');
const app = require('../../backend/dist/app').default;
const { generateMockToken } = require('../utils/mockAuth');

describe('Security: Input Validation & Injection Prevention', () => {
  const targetRoute = '/api/users'; // Example of a POST route protected by Zod schemas
  let adminToken;

  beforeAll(() => {
    adminToken = generateMockToken('admin');
  });

  it('should return 400 Bad Request when required fields are missing', async () => {
    const incompletePayload = {
      // Assuming 'email' and 'password' are required fields by the Zod schema
      name: 'John Doe' 
    };

    const response = await request(app)
      .post(targetRoute)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(incompletePayload);

    expect(response.status).toBe(400);
    // Assuming Zod errors are returned in the response body
    // expect(response.body).toHaveProperty('errors');
  });

  it('should safely reject or sanitize XSS injection payloads', async () => {
    const maliciousPayload = {
      email: 'hacker@urms.test',
      password: 'StrongPassword123!',
      name: '<script>alert("XSS")</script>John Doe',
      role: 'student'
    };

    const response = await request(app)
      .post(targetRoute)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(maliciousPayload);

    // If validation strictly rejects HTML tags
    if (response.status === 400) {
      expect(response.status).toBe(400);
    } else {
      // If validation sanitizes the input, ensure it was successful
      expect([200, 201]).toContain(response.status);
      if (response.body && response.body.name) {
        expect(response.body.name).not.toContain('<script>');
      }
    }
  });

  it('should safely reject SQL injection payloads in JSON body', async () => {
    const sqliPayload = {
      email: "admin@urms.test' OR '1'='1",
      password: "password123",
      name: "Attacker",
      role: "admin"
    };

    const response = await request(app)
      .post(targetRoute)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(sqliPayload);

    // Assuming the Zod schema checks for strict email format
    expect(response.status).toBe(400);
  });
});
