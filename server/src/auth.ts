import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from './config.js';

export interface AuthUser {
  id: number;
  role: 'professor' | 'gestao';
  name: string;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, config.jwtSecret, { expiresIn: '7d' });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthUser;
    req.user = { id: payload.id, role: payload.role, name: payload.name };
    next();
  } catch {
    res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
  }
}

export function requireGestao(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'gestao') {
    res.status(403).json({ error: 'Apenas a gestão pode realizar esta ação.' });
    return;
  }
  next();
}
