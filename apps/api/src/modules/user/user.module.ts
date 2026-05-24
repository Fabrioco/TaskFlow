import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TokenService } from '../../shared/jwt/token.service';

@Module({
  controllers: [UserController],
  providers: [UserService, TokenService],
  exports: [],
})
export class UserModule {}
