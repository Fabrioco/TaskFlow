import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from '../../shared/jwt/token.service';
import { CryptoService } from '../../shared/crypto/crypto.service';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, CryptoService, TokenService],
  exports: [],
})
export class AuthModule {}
