import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { TokenService } from '../../shared/jwt/token.service';

@Module({
  controllers: [WorkspacesController],
  providers: [WorkspacesService, TokenService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
