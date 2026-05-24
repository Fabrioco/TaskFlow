import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { CurrentUser } from '../../shared/decorator/current-user.decorator';
import type { User } from '../../generated/prisma';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@Controller('user')
@ApiTags('Usuários')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Retorna o perfil do usuário' })
  @ApiResponse({ status: 200, description: 'Perfil do usuário' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async getProfile(@CurrentUser() user: User) {
    return this.service.getProfile(user.id);
  }
}
