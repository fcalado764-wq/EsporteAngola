import { Router } from 'express';
import { z } from 'zod';
import { login, refreshAccessToken, getCurrentUser, signup } from '../services/auth.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const signupSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['trainer', 'admin'])
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1)
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = login(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/signup', async (req, res, next) => {
  try {
    const { name, email, password, role } = signupSchema.parse(req.body);
    const result = await signup(name, email, password, role);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
});

router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const result = refreshAccessToken(refreshToken);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/me', (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    const user = getCurrentUser(token);
    
    if (!user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
