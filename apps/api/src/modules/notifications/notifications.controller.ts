import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorator/current-user.decorator';
import type { User } from '../../generated/prisma';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // GET /notifications
  @Get()
  @ApiOperation({
    summary: 'Listar notificações',
    description:
      'Retorna todas as notificações do usuário autenticado, ordenadas da mais recente para a mais antiga.',
  })
  @ApiResponse({ status: 200, description: 'Lista de notificações.' })
  findAll(@CurrentUser() user: User) {
    return this.notificationsService.findAll(user.id);
  }

  // PATCH /notifications/read-all
  @Patch('read-all')
  @ApiOperation({ summary: 'Marcar todas como lidas' })
  @ApiResponse({
    status: 200,
    description: 'Notificações marcadas como lidas.',
    schema: { example: { updated: 5 } },
  })
  markAllAsRead(@CurrentUser() user: User) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  // PATCH /notifications/:id/read
  @Patch(':id/read')
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  @ApiParam({ name: 'id', description: 'ID da notificação' })
  @ApiResponse({ status: 200, description: 'Notificação marcada como lida.' })
  @ApiResponse({ status: 403, description: 'Sem acesso a esta notificação.' })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada.' })
  markAsRead(@CurrentUser() user: User, @Param('id') notificationId: string) {
    return this.notificationsService.markAsRead(user.id, notificationId);
  }
}
