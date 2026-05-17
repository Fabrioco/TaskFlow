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
}
