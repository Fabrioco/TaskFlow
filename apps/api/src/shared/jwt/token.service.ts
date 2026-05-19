import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  email: string;
}

@Injectable()
export class TokenService {
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(
      { id: payload.id, email: payload.email },
      process.env.JWT_SECRET!,
      {
        expiresIn: '15m',
        subject: 'user',
      },
    );
  }

  generateRefreshToken(payload: TokenPayload): string {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }
    return jwt.sign(
      { id: payload.id }, // No refresh, o ID já é suficiente
      process.env.JWT_REFRESH_SECRET, // Uma chave secreta diferente por segurança
      { expiresIn: '7d' },
    );
  }

  verifyRefreshToken(token: string): { id: string } {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { id: string };
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
  }
}
