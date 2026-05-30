import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { TokenService } from '../../shared/jwt/token.service';

@Module({
  controllers: [ProjectsController],
  providers: [ProjectsService, TokenService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
