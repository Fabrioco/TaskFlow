import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorator/current-user.decorator';
import type { User } from '../../generated/prisma';

@ApiTags('Comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks/:taskId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  // POST /tasks/:taskId/comments
  @Post()
  @ApiOperation({
    summary: 'Criar comentário',
    description: 'Qualquer membro do workspace pode comentar.',
  })
  @ApiParam({ name: 'taskId', description: 'ID da task' })
  @ApiResponse({ status: 201, description: 'Comentário criado.' })
  @ApiResponse({ status: 403, description: 'Sem acesso ao workspace.' })
  @ApiResponse({ status: 404, description: 'Task não encontrada.' })
  create(
    @CurrentUser() user: User,
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(user.id, taskId, dto);
  }

  // GET /tasks/:taskId/comments
  @Get()
  @ApiOperation({
    summary: 'Listar comentários da task',
    description: 'Ordenados por data de criação (mais antigo primeiro).',
  })
  @ApiParam({ name: 'taskId', description: 'ID da task' })
  @ApiResponse({ status: 200, description: 'Lista de comentários.' })
  @ApiResponse({ status: 403, description: 'Sem acesso ao workspace.' })
  @ApiResponse({ status: 404, description: 'Task não encontrada.' })
  findAll(@CurrentUser() user: User, @Param('taskId') taskId: string) {
    return this.commentsService.findAll(user.id, taskId);
  }

  // PATCH /tasks/:taskId/comments/:id
  @Patch(':id')
  @ApiOperation({
    summary: 'Editar comentário',
    description: 'Apenas o autor pode editar.',
  })
  @ApiParam({ name: 'taskId', description: 'ID da task' })
  @ApiParam({ name: 'id', description: 'ID do comentário' })
  @ApiResponse({ status: 200, description: 'Comentário atualizado.' })
  @ApiResponse({ status: 403, description: 'Apenas o autor pode editar.' })
  @ApiResponse({ status: 404, description: 'Comentário não encontrado.' })
  update(
    @CurrentUser() user: User,
    @Param('taskId') taskId: string,
    @Param('id') commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(user.id, taskId, commentId, dto);
  }

  // DELETE /tasks/:taskId/comments/:id
  @Delete(':id')
  @ApiOperation({
    summary: 'Deletar comentário',
    description:
      'O autor pode deletar o próprio. OWNER e ADMIN podem deletar qualquer um.',
  })
  @ApiParam({ name: 'taskId', description: 'ID da task' })
  @ApiParam({ name: 'id', description: 'ID do comentário' })
  @ApiResponse({ status: 200, description: 'Comentário deletado.' })
  @ApiResponse({ status: 403, description: 'Sem permissão.' })
  @ApiResponse({ status: 404, description: 'Comentário não encontrado.' })
  remove(
    @CurrentUser() user: User,
    @Param('taskId') taskId: string,
    @Param('id') commentId: string,
  ) {
    return this.commentsService.remove(user.id, taskId, commentId);
  }
}
