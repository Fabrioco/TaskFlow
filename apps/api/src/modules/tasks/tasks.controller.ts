import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { TaskStatus, Priority, User } from '@prisma/client';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dtos/create-task.dto';
import { UpdateTaskDto } from './dtos/update-task.dto';
import { ListTasksDto } from './dtos/list-tasks.dto';
import { ReorderTasksDto } from './dtos/reorder-tasks.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorator/current-user.decorator';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // POST /projects/:projectId/tasks
  @Post()
  @ApiOperation({ summary: 'Criar task', description: 'Qualquer membro do workspace pode criar tasks.' })
  @ApiParam({ name: 'projectId', description: 'ID do projeto' })
  @ApiResponse({ status: 201, description: 'Task criada.' })
  @ApiResponse({ status: 403, description: 'Sem acesso ao workspace.' })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado.' })
  create(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(user.id, projectId, dto);
  }

  // GET /projects/:projectId/tasks
  @Get()
  @ApiOperation({ summary: 'Listar tasks', description: 'Retorna tasks ordenadas por `order`. Suporta filtros por status, prioridade e assignee.' })
  @ApiParam({ name: 'projectId', description: 'ID do projeto' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'priority', required: false, enum: Priority })
  @ApiQuery({ name: 'assigneeId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Lista de tasks.' })
  @ApiResponse({ status: 403, description: 'Sem acesso ao workspace.' })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado.' })
  findAll(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
    @Query() filters: ListTasksDto,
  ) {
    return this.tasksService.findAll(user.id, projectId, filters);
  }

  // GET /projects/:projectId/tasks/:id
  @Get(':id')
  @ApiOperation({ summary: 'Buscar task por ID' })
  @ApiParam({ name: 'projectId', description: 'ID do projeto' })
  @ApiParam({ name: 'id', description: 'ID da task' })
  @ApiResponse({ status: 200, description: 'Task encontrada.' })
  @ApiResponse({ status: 403, description: 'Sem acesso ao workspace.' })
  @ApiResponse({ status: 404, description: 'Task não encontrada.' })
  findOne(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
    @Param('id') taskId: string,
  ) {
    return this.tasksService.findOne(user.id, projectId, taskId);
  }

  // PATCH /projects/:projectId/tasks/:id
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar task', description: 'Qualquer membro pode atualizar. Para remover assignee, envie assigneeId: null.' })
  @ApiParam({ name: 'projectId', description: 'ID do projeto' })
  @ApiParam({ name: 'id', description: 'ID da task' })
  @ApiResponse({ status: 200, description: 'Task atualizada.' })
  @ApiResponse({ status: 403, description: 'Sem acesso ao workspace.' })
  @ApiResponse({ status: 404, description: 'Task não encontrada.' })
  update(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
    @Param('id') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(user.id, projectId, taskId, dto);
  }

  // DELETE /projects/:projectId/tasks/:id
  @Delete(':id')
  @ApiOperation({ summary: 'Deletar task', description: 'Requer role OWNER ou ADMIN.' })
  @ApiParam({ name: 'projectId', description: 'ID do projeto' })
  @ApiParam({ name: 'id', description: 'ID da task' })
  @ApiResponse({ status: 200, description: 'Task deletada.' })
  @ApiResponse({ status: 403, description: 'Permissão insuficiente.' })
  @ApiResponse({ status: 404, description: 'Task não encontrada.' })
  remove(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
    @Param('id') taskId: string,
  ) {
    return this.tasksService.remove(user.id, projectId, taskId);
  }

  // PATCH /projects/:projectId/tasks/reorder
  @Patch('reorder')
  @ApiOperation({
    summary: 'Reordenar tasks',
    description: 'Recebe um array com todos os IDs do projeto na nova ordem. Atualiza o campo `order` de cada task via transaction.',
  })
  @ApiParam({ name: 'projectId', description: 'ID do projeto' })
  @ApiResponse({ status: 200, description: 'Tasks reordenadas.', schema: { example: { reordered: 5 } } })
  @ApiResponse({ status: 400, description: 'IDs inválidos ou que não pertencem ao projeto.' })
  @ApiResponse({ status: 403, description: 'Sem acesso ao workspace.' })
  reorder(
    @CurrentUser() user: User,
    @Param('projectId') projectId: string,
    @Body() dto: ReorderTasksDto,
  ) {
    return this.tasksService.reorder(user.id, projectId, dto);
  }
}
