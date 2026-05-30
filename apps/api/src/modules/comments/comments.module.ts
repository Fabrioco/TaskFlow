import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { TokenService } from '../../shared/jwt/token.service';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, TokenService],
  exports: [CommentsService],
})
export class CommentsModule {}
