import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { hasSupabaseConfig } from './supabase.js';
import {
  findCoachByEmail,
  findCoachById,
  insertCoach,
  listAllCoaches,
  createAuthUser,
  updateAuthUserPassword,
  verifyAuthCredentials,
  markPasswordChanged,
  initializeMockPasswords
} from './coachRepository.js';

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

export async function login(email, password) {
  if (!email || !password) {
    throw new Error('Email e senha são obrigatórios');
  }

  const coach = await findCoachByEmail(email);

  if (!coach) {
    throw new Error('Email não encontrado');
  }

  if (hasSupabaseConfig()) {
    // A senha real vive no Supabase Auth, nao na tabela trainer_profiles.
    const verifiedId = await verifyAuthCredentials(email, password);
    if (!verifiedId) {
      throw new Error('Senha incorreta');
    }
  } else {
    // Modo local/mock (sem Supabase) - mantem o hash bcrypt na propria mockData.
    if (!coach.password || !verifyPassword(password, coach.password)) {
      throw new Error('Senha incorreta');
    }
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
      status: coach.status,
      teamId: coach.teamId ?? null,
      mustChangePassword: Boolean(coach.mustChangePassword)
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

export async function getCurrentUser(token) {
  const decoded = verifyToken(token);

  if (!decoded) {
    return null;
  }

  const coach = await findCoachById(decoded.userId);

  if (!coach) {
    return null;
  }

  return {
    id: coach.id,
    name: coach.name,
    email: coach.email,
    role: coach.role,
    status: coach.status,
    teamId: coach.teamId ?? null,
    mustChangePassword: Boolean(coach.mustChangePassword)
  };
}

// So usado em desenvolvimento local sem Supabase configurado.
export function initializePasswords() {
  initializeMockPasswords(hashPassword);
}

// Gera uma senha temporaria legivel mas dificil de adivinhar (ex: "aSGR-tiV4").
export function generateTemporaryPassword() {
  const bytes = crypto.randomBytes(6).toString('base64url'); // sem caracteres ambiguos tipo +/
  return `${bytes.slice(0, 4)}-${bytes.slice(4, 8)}`;
}

// Usado pela rota GET /api/coaches (apenas admin) para listar treinadores.
export async function listCoaches() {
  const coaches = await listAllCoaches();
  return coaches.map((coach) => ({
    id: coach.id,
    name: coach.name,
    email: coach.email,
    role: coach.role,
    status: coach.status,
    teamId: coach.teamId ?? null,
    mustChangePassword: Boolean(coach.mustChangePassword),
    createdAt: coach.createdAt || null
  }));
}

// Criacao de um treinador feita EXCLUSIVAMENTE pelo admin/diretor autenticado
// (a validacao de role acontece no middleware da rota, antes desta funcao correr).
// 1) cria o utilizador no Supabase Auth com uma senha temporaria
// 2) usa o id devolvido para criar o perfil em trainer_profiles
// 3) devolve a senha temporaria em texto simples, uma unica vez, para ir por email
export async function registerTrainer({ name, email, teamId }) {
  if (!name || !email) {
    throw new Error('Nome e email do treinador sao obrigatorios');
  }

  const existingCoach = await findCoachByEmail(email);
  if (existingCoach) {
    throw new Error('Ja existe uma conta com este email');
  }

  const temporaryPassword = generateTemporaryPassword();

  let coachId;
  if (hasSupabaseConfig()) {
    coachId = await createAuthUser({ email, password: temporaryPassword });
  }

  const newCoach = await insertCoach({
    id: coachId,
    name,
    email,
    password: hasSupabaseConfig() ? undefined : hashPassword(temporaryPassword),
    role: 'trainer',
    status: 'active',
    teamId: teamId || null,
    mustChangePassword: true
  });

  return {
    id: newCoach.id,
    name: newCoach.name,
    email: newCoach.email,
    role: newCoach.role,
    status: newCoach.status,
    teamId: newCoach.teamId,
    temporaryPassword // devolvido uma unica vez, so para o admin poder enviar/mostrar
  };
}

// Permite a qualquer utilizador autenticado mudar a propria senha
// (usado tanto no primeiro login do treinador como para trocas normais).
export async function changePassword(userId, currentPassword, newPassword) {
  const coach = await findCoachById(userId);

  if (!coach) {
    throw new Error('Utilizador nao encontrado');
  }

  if (!newPassword || newPassword.length < 8) {
    throw new Error('A nova senha deve ter pelo menos 8 caracteres');
  }

  if (hasSupabaseConfig()) {
    const verifiedId = await verifyAuthCredentials(coach.email, currentPassword);
    if (!verifiedId) {
      throw new Error('Senha atual incorreta');
    }
    await updateAuthUserPassword(coach.id, newPassword);
    await markPasswordChanged(coach.id);
  } else {
    if (!coach.password || !verifyPassword(currentPassword, coach.password)) {
      throw new Error('Senha atual incorreta');
    }
    coach.password = hashPassword(newPassword);
    await markPasswordChanged(coach.id);
  }

  return { message: 'Senha alterada com sucesso' };
}

export async function signup(name, email, password, role) {
  if (!name || !email || !password || !role) {
    throw new Error('Nome, email, senha e tipo de conta são obrigatórios');
  }

  const existingCoach = await findCoachByEmail(email);

  if (existingCoach) {
    throw new Error('Email já registado');
  }

  let coachId;
  if (hasSupabaseConfig()) {
    coachId = await createAuthUser({ email, password });
  }

  const newCoach = await insertCoach({
    id: coachId,
    name,
    email,
    password: hasSupabaseConfig() ? undefined : hashPassword(password),
    role,
    status: 'pending',
    teamId: null,
    mustChangePassword: false
  });

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