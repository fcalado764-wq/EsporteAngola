import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { coaches } from '../data/mockData.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function generateTokens(userId, email, role) {
  const token = jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { userId, email, role },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );

  return { token, refreshToken };
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function login(email, password) {
  if (!email || !password) {
    throw new Error('Email e senha são obrigatórios');
  }

  const coach = coaches.find((c) => c.email === email);
  
  if (!coach) {
    throw new Error('Email não encontrado');
  }

  if (!coach.password) {
    throw new Error('Conta não configurada com senha');
  }

  if (!verifyPassword(password, coach.password)) {
    throw new Error('Senha incorreta');
  }

  if (coach.status !== 'active') {
    throw new Error('Conta desativada');
  }

  const { token, refreshToken } = generateTokens(coach.id, coach.email, coach.role);

  return {
    token,
    refreshToken,
    user: {
      id: coach.id,
      name: coach.name,
      email: coach.email,
      role: coach.role,
      status: coach.status
    }
  };
}

export function refreshAccessToken(refreshToken) {
  const decoded = verifyRefreshToken(refreshToken);
  
  if (!decoded) {
    throw new Error('Refresh token inválido');
  }

  const { token, refreshToken: newRefreshToken } = generateTokens(
    decoded.userId,
    decoded.email,
    decoded.role
  );

  return {
    token,
    refreshToken: newRefreshToken
  };
}

export function getCurrentUser(token) {
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return null;
  }

  const coach = coaches.find((c) => c.id === decoded.userId);
  
  if (!coach) {
    return null;
  }

  return {
    id: coach.id,
    name: coach.name,
    email: coach.email,
    role: coach.role,
    status: coach.status
  };
}

export function initializePasswords() {
  coaches.forEach((coach) => {
    if (!coach.password) {
      coach.password = hashPassword('password123');
    }
  });
}

export async function signup(name, email, password, role) {
  if (!name || !email || !password || !role) {
    throw new Error('Nome, email, senha e tipo de conta são obrigatórios');
  }

  const existingCoach = coaches.find((c) => c.email === email);
  
  if (existingCoach) {
    throw new Error('Email já registado');
  }

  const newCoach = {
    id: `${role}-${Date.now()}`,
    name,
    email,
    password: hashPassword(password),
    role,
    status: 'pending'
  };

  coaches.push(newCoach);

  return {
    message: 'Conta criada com sucesso. Pendente de aprovação do administrador.',
    user: {
      id: newCoach.id,
      name: newCoach.name,
      email: newCoach.email,
      role: newCoach.role,
      status: newCoach.status
    }
  };
}
