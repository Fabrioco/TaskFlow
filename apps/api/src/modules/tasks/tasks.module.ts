import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TokenService } from '../../shared/jwt/token.service';

@Module({
  controllers: [TasksController],
  providers: [TasksService, TokenService],
  exports: [TasksService],
})
export class TasksModule {}
