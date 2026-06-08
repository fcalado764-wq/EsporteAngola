import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import cors from 'cors';
import apiRouter from '../server/routes/api.js';

let app;
let server;

beforeAll(() => {
  app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', apiRouter);

  app.use((error, req, res, next) => {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Dados invalidos', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  });

  server = app.listen(3001);
});

afterAll(() => {
  if (server) {
    server.close();
  }
});

describe('API Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await fetch('http://localhost:3001/api/health');
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(data.service).toBe('handball-team-manager');
    });
  });

  describe('GET /api/athletes', () => {
    it('should return list of athletes', async () => {
      const response = await fetch('http://localhost:3001/api/athletes');
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should include athlete properties', async () => {
      const response = await fetch('http://localhost:3001/api/athletes');
      const athletes = await response.json();
      const athlete = athletes[0];
      expect(athlete.id).toBeDefined();
      expect(athlete.name).toBeDefined();
      expect(athlete.number).toBeDefined();
      expect(athlete.position).toBeDefined();
    });
  });

  describe('POST /api/athletes', () => {
    it('should create new athlete', async () => {
      const newAthlete = {
        name: 'New Player',
        number: 99,
        position: 'Extremo'
      };
      const response = await fetch('http://localhost:3001/api/athletes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAthlete)
      });
      const data = await response.json();
      expect(response.status).toBe(201);
      expect(data.name).toBe('New Player');
      expect(data.number).toBe(99);
      expect(data.id).toBeDefined();
    });

    it('should reject invalid athlete data', async () => {
      const invalidAthlete = {
        name: 'A',
        number: 100,
        position: 'X'
      };
      const response = await fetch('http://localhost:3001/api/athletes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidAthlete)
      });
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/trainings', () => {
    it('should return list of trainings', async () => {
      const response = await fetch('http://localhost:3001/api/trainings');
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/trainings', () => {
    it('should create new training', async () => {
      const newTraining = {
        date: '2026-06-25',
        time: '17:30',
        title: 'Treino Novo',
        focus: 'Transição'
      };
      const response = await fetch('http://localhost:3001/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTraining)
      });
      const data = await response.json();
      expect(response.status).toBe(201);
      expect(data.date).toBe('2026-06-25');
      expect(data.title).toBe('Treino Novo');
    });
  });

  describe('GET /api/dashboard', () => {
    it('should return dashboard data', async () => {
      const response = await fetch('http://localhost:3001/api/dashboard');
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.team).toBeDefined();
      expect(data.metrics).toBeDefined();
      expect(data.alerts).toBeDefined();
    });

    it('should include valid metrics', async () => {
      const response = await fetch('http://localhost:3001/api/dashboard');
      const data = await response.json();
      expect(data.metrics.athletes).toBeGreaterThan(0);
      expect(data.metrics.attendanceAverage).toBeGreaterThanOrEqual(0);
      expect(data.metrics.attendanceAverage).toBeLessThanOrEqual(100);
    });
  });

  describe('GET /api/stats', () => {
    it('should return stats data', async () => {
      const response = await fetch('http://localhost:3001/api/stats');
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.goalsByAthlete).toBeDefined();
      expect(data.attendanceByAthlete).toBeDefined();
      expect(data.riskList).toBeDefined();
    });
  });

  describe('GET /api/teams', () => {
    it('should return list of teams', async () => {
      const response = await fetch('http://localhost:3001/api/teams');
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('POST /api/teams', () => {
    it('should create new team', async () => {
      const newTeam = {
        name: 'Time Teste',
        category: 'Juvenil',
        season: '2026/27',
        coach: 'Test Coach',
        venue: 'Test Stadium'
      };
      const response = await fetch('http://localhost:3001/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeam)
      });
      const data = await response.json();
      expect(response.status).toBe(201);
      expect(data.name).toBe('Time Teste');
    });
  });

  describe('GET /api/coaches', () => {
    it('should return list of coaches', async () => {
      const response = await fetch('http://localhost:3001/api/coaches');
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('POST /api/auth/register-trainer', () => {
    it('should register new coach', async () => {
      const newCoach = {
        name: 'Test Trainer',
        email: 'test-trainer-' + Date.now() + '@example.com',
        password: 'password123'
      };
      const response = await fetch('http://localhost:3001/api/auth/register-trainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCoach)
      });
      const data = await response.json();
      expect(response.status).toBe(201);
      expect(data.name).toBe('Test Trainer');
      expect(data.password).toBeUndefined();
    });

    it('should reject invalid coach data', async () => {
      const invalidCoach = {
        name: 'T',
        email: 'invalid',
        password: 'short'
      };
      const response = await fetch('http://localhost:3001/api/auth/register-trainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidCoach)
      });
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/ai/chat', () => {
    it('should answer chat question', async () => {
      const response = await fetch('http://localhost:3001/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'Como está a equipa?' })
      });
      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data.answer).toBeDefined();
      expect(data.provider).toBeDefined();
    });

    it('should reject short question', async () => {
      const response = await fetch('http://localhost:3001/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'Hi' })
      });
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/reports/performance', () => {
    it('should generate PDF report', async () => {
      const response = await fetch('http://localhost:3001/api/reports/performance', {
        method: 'GET'
      });
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/pdf');
      const buffer = await response.arrayBuffer();
      expect(buffer.byteLength).toBeGreaterThan(0);
    });
  });
});
