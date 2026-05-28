import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { TokenService } from '../../shared/jwt/token.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, TokenService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
