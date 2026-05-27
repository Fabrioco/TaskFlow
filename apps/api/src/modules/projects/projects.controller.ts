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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { ListProjectsDto } from './dtos/list-projects.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorator/current-user.decorator';
import type { User } from '../../generated/prisma';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces/:workspaceId/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // POST /workspaces/:workspaceId/projects
  @Post()
  @ApiOperation({
    summary: 'Criar projeto',
    description: 'Requer role OWNER ou ADMIN.',
  })
  @ApiParam({ name: 'workspaceId', description: 'ID do workspace' })
  @ApiResponse({ status: 201, description: 'Projeto criado.' })
  @ApiResponse({ status: 403, description: 'Permissão insuficiente.' })
  create(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(user.id, workspaceId, dto);
  }

  // GET /workspaces/:workspaceId/projects
  @Get()
  @ApiOperation({
    summary: 'Listar projetos',
    description:
      'Por padrão retorna apenas projetos ativos. Use ?archived=true para listar arquivados.',
  })
  @ApiParam({ name: 'workspaceId', description: 'ID do workspace' })
  @ApiQuery({
    name: 'archived',
    required: false,
    type: Boolean,
    example: false,
  })
  @ApiResponse({ status: 200, description: 'Lista de projetos.' })
  @ApiResponse({ status: 403, description: 'Sem acesso ao workspace.' })
  findAll(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Query() filters: ListProjectsDto,
  ) {
    return this.projectsService.findAll(user.id, workspaceId, filters);
  }

  // GET /workspaces/:workspaceId/projects/:id
  @Get(':id')
  @ApiOperation({ summary: 'Buscar projeto por ID' })
  @ApiParam({ name: 'workspaceId', description: 'ID do workspace' })
  @ApiParam({ name: 'id', description: 'ID do projeto' })
  @ApiResponse({ status: 200, description: 'Projeto encontrado.' })
  @ApiResponse({ status: 403, description: 'Sem acesso ao workspace.' })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado.' })
  findOne(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') projectId: string,
  ) {
    return this.projectsService.findOne(user.id, workspaceId, projectId);
  }

  // PATCH /workspaces/:workspaceId/projects/:id
  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar projeto',
    description: 'Requer role OWNER ou ADMIN.',
  })
  @ApiParam({ name: 'workspaceId', description: 'ID do workspace' })
  @ApiParam({ name: 'id', description: 'ID do projeto' })
  @ApiResponse({ status: 200, description: 'Projeto atualizado.' })
  @ApiResponse({ status: 403, description: 'Permissão insuficiente.' })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado.' })
  update(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(user.id, workspaceId, projectId, dto);
  }

  // DELETE /workspaces/:workspaceId/projects/:id
  @Delete(':id')
  @ApiOperation({
    summary: 'Deletar projeto',
    description: 'Requer role OWNER. Remove o projeto e todas as suas tasks.',
  })
  @ApiParam({ name: 'workspaceId', description: 'ID do workspace' })
  @ApiParam({ name: 'id', description: 'ID do projeto' })
  @ApiResponse({ status: 200, description: 'Projeto deletado.' })
  @ApiResponse({ status: 403, description: 'Permissão insuficiente.' })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado.' })
  remove(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') projectId: string,
  ) {
    return this.projectsService.remove(user.id, workspaceId, projectId);
  }

  // PATCH /workspaces/:workspaceId/projects/:id/archive
  @Patch(':id/archive')
  @ApiOperation({
    summary: 'Arquivar / desarquivar projeto',
    description:
      'Toggle: arquiva se ativo, desarquiva se arquivado. Requer role OWNER ou ADMIN.',
  })
  @ApiParam({ name: 'workspaceId', description: 'ID do workspace' })
  @ApiParam({ name: 'id', description: 'ID do projeto' })
  @ApiResponse({ status: 200, description: 'Estado de arquivamento alterado.' })
  @ApiResponse({ status: 403, description: 'Permissão insuficiente.' })
  @ApiResponse({ status: 404, description: 'Projeto não encontrado.' })
  archive(
    @CurrentUser() user: User,
    @Param('workspaceId') workspaceId: string,
    @Param('id') projectId: string,
  ) {
    return this.projectsService.archive(user.id, workspaceId, projectId);
  }
}
