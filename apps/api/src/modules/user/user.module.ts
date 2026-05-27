import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TokenService } from '../../shared/jwt/token.service';
import { UploadImageService } from '../upload-image/upload-image.service';

@Module({
  controllers: [UserController],
  providers: [UserService, TokenService, UploadImageService],
  exports: [],
})
export class UserModule {}
