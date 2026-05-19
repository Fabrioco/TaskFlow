import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { TokenService } from '../jwt/token.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Pega o token do header: "Authorization: Bearer <token>"
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Token ausente');
    }

    // Valida e decodifica o token
    const payload = this.tokenService.verifyAccessToken(token);

    if (!payload) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    // Injeta o usuário no request — disponível via @CurrentUser()
    request.user = { id: payload.id, email: payload.email };

    return true;
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
