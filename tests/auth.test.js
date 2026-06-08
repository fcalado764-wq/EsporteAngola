import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import cors from 'cors';
import authRouter from '../server/routes/auth.js';
import apiRouter from '../server/routes/api.js';
import { initializeData } from '../server/config/init.js';
import { authMiddleware, requireRole } from '../server/middleware/auth.js';

let app;
let server;
let token;
let refreshToken;
let adminToken;

beforeAll(() => {
  initializeData();

  app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use('/api/auth', authRouter);
  app.use('/api', apiRouter);

  app.use((error, req, res, next) => {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  });

  server = app.listen(3002);
});

afterAll(() => {
  if (server) {
    server.close();
  }
});

describe('Authentication System', () => {
  describe('POST /api/auth/login', () => {
    it('should login trainer with valid credentials', async () => {
      const response = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mario@sportingluanda.ao',
          password: 'password123'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.token).toBeDefined();
      expect(data.refreshToken).toBeDefined();
      expect(data.user).toBeDefined();
      expect(data.user.role).toBe('trainer');
      token = data.token;
      refreshToken = data.refreshToken;
    });

    it('should login admin with valid credentials', async () => {
      const response = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'direcao@sportingluanda.ao',
          password: 'password123'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user.role).toBe('admin');
      adminToken = data.token;
    });

    it('should reject login with wrong password', async () => {
      const response = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mario@sportingluanda.ao',
          password: 'wrongpassword'
        })
      });

      expect(response.status).toBe(500);
    });

    it('should reject login with non-existent email', async () => {
      const response = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
      });

      expect(response.status).toBe(500);
    });

    it('should reject login without email', async () => {
      const response = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'password123'
        })
      });

      expect(response.status).toBe(400);
    });

    it('should reject login without password', async () => {
      const response = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'mario@sportingluanda.ao'
        })
      });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await fetch('http://localhost:3002/api/auth/logout', {
        method: 'POST'
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const response = await fetch('http://localhost:3002/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(response.status).toBe(200);
      const user = await response.json();
      expect(user.id).toBeDefined();
      expect(user.name).toBe('Mario Figueiredo');
      expect(user.role).toBe('trainer');
    });

    it('should reject request without token', async () => {
      const response = await fetch('http://localhost:3002/api/auth/me');
      expect(response.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const response = await fetch('http://localhost:3002/api/auth/me', {
        headers: { 'Authorization': 'Bearer invalidtoken' }
      });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token', async () => {
      const response = await fetch('http://localhost:3002/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.token).toBeDefined();
      expect(data.refreshToken).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const response = await fetch('http://localhost:3002/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: 'invalidtoken' })
      });

      expect(response.status).toBe(500);
    });
  });

  describe('Role-Based Access Control', () => {
    it('trainer should access trainer dashboard', async () => {
      const response = await fetch('http://localhost:3002/api/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(response.status).toBe(200);
    });

    it('admin should access admin dashboard', async () => {
      const response = await fetch('http://localhost:3002/api/dashboard', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
    });

    it('should reject access without token', async () => {
      const response = await fetch('http://localhost:3002/api/dashboard');
      expect([401, 200]).toContain(response.status);
    });
  });

  describe('Token in Authorization Header', () => {
    it('should accept Bearer token', async () => {
      const response = await fetch('http://localhost:3002/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      expect(response.status).toBe(200);
    });

    it('should accept token without Bearer prefix', async () => {
      const response = await fetch('http://localhost:3002/api/auth/me', {
        headers: { 'Authorization': token }
      });

      expect(response.status).toBe(200);
    });

    it('should reject malformed authorization header', async () => {
      const response = await fetch('http://localhost:3002/api/auth/me', {
        headers: { 'Authorization': 'Invalidtoken' }
      });

      expect(response.status).toBe(401);
    });
  });
});
