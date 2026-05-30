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
  ApiBody,
} from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dtos/create-workspace.dto';
import { UpdateWorkspaceDto } from './dtos/update-workspace.dto';
import { InviteMemberDto } from './dtos/invite-member.dto';
import { UpdateMemberRoleDto } from './dtos/update-member-role.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorator/current-user.decorator';
import type { User } from '../../generated/prisma';

@ApiTags('Workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  // ─── Workspaces ─────────────────────────────────────────────────────────────

  // POST /workspaces
  @Post()
  @ApiOperation({
    summary: 'Criar workspace',
    description:
      'Cria um novo workspace. O usuário autenticado se torna o OWNER automaticamente.',
  })
  @ApiResponse({ status: 201, description: 'Workspace criado com sucesso.' })
  @ApiResponse({ status: 409, description: 'Slug já está em uso.' })
  @ApiBody({ type: CreateWorkspaceDto })
  create(@CurrentUser() user: User, @Body() dto: CreateWorkspaceDto) {
    console.log(user.id, 'é o id');
    return this.workspacesService.create(user.id, dto);
  }

  // GET /workspaces
  @Get()
  @ApiOperation({
    summary: 'Listar workspaces do usuário',
    description:
      'Retorna todos os workspaces em que o usuário autenticado é membro.',
  })
  @ApiResponse({ status: 200, description: 'Lista de workspaces.' })
  findAll(@CurrentUser() user: User) {
    return this.workspacesService.findAllByUser(user.id);
  }

  // GET /workspaces/:slug
  @Get(':slug')
  @ApiOperation({ summary: 'Buscar workspace por slug' })
  @ApiParam({ name: 'slug', example: 'minha-empresa' })
  @ApiResponse({ status: 200, description: 'Workspace encontrado.' })
  @ApiResponse({ status: 403, description: 'Sem acesso a este workspace.' })
  @ApiResponse({ status: 404, description: 'Workspace não encontrado.' })
  findOne(@CurrentUser() user: User, @Param('slug') slug: string) {
    return this.workspacesService.findBySlug(user.id, slug);
  }

  // PATCH /workspaces/:id
  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar workspace',
    description: 'Requer role OWNER ou ADMIN.',
  })
  @ApiParam({ name: 'id', description: 'ID do workspace' })
  @ApiResponse({ status: 200, description: 'Workspace atualizado.' })
  @ApiResponse({ status: 403, description: 'Permissão insuficiente.' })
  @ApiResponse({ status: 409, description: 'Slug já está em uso.' })
  update(
    @CurrentUser() user: User,
    @Param('id') workspaceId: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspacesService.update(user.id, workspaceId, dto);
  }

  // DELETE /workspaces/:id
  @Delete(':id')
  @ApiOperation({
    summary: 'Deletar workspace',
    description: 'Requer role OWNER.',
  })
  @ApiParam({ name: 'id', description: 'ID do workspace' })
  @ApiResponse({ status: 200, description: 'Workspace deletado.' })
  @ApiResponse({ status: 403, description: 'Permissão insuficiente.' })
  remove(@CurrentUser() user: User, @Param('id') workspaceId: string) {
    return this.workspacesService.remove(user.id, workspaceId);
  }

  // ─── Members ─────────────────────────────────────────────────────────────────

  // POST /workspaces/:id/members
  @Post(':id/members')
  @ApiOperation({
    summary: 'Convidar membro',
    description: 'Adiciona um usuário pelo email. Requer role OWNER ou ADMIN.',
  })
  @ApiParam({ name: 'id', description: 'ID do workspace' })
  @ApiResponse({ status: 201, description: 'Membro adicionado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  @ApiResponse({ status: 409, description: 'Usuário já é membro.' })
  inviteMember(
    @CurrentUser() user: User,
    @Param('id') workspaceId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.workspacesService.inviteMember(user.id, workspaceId, dto);
  }

  // GET /workspaces/:id/members
  @Get(':id/members')
  @ApiOperation({ summary: 'Listar membros do workspace' })
  @ApiParam({ name: 'id', description: 'ID do workspace' })
  @ApiResponse({ status: 200, description: 'Lista de membros.' })
  @ApiResponse({ status: 403, description: 'Sem acesso a este workspace.' })
  listMembers(@CurrentUser() user: User, @Param('id') workspaceId: string) {
    return this.workspacesService.listMembers(user.id, workspaceId);
  }

  // PATCH /workspaces/:id/members/:userId
  @Patch(':id/members/:userId')
  @ApiOperation({
    summary: 'Atualizar role de membro',
    description:
      'Requer role OWNER. Não é possível atribuir OWNER por esta rota.',
  })
  @ApiParam({ name: 'id', description: 'ID do workspace' })
  @ApiParam({ name: 'userId', description: 'ID do membro a ser atualizado' })
  @ApiResponse({ status: 200, description: 'Role atualizado.' })
  @ApiResponse({ status: 403, description: 'Permissão insuficiente.' })
  @ApiResponse({ status: 404, description: 'Membro não encontrado.' })
  updateMemberRole(
    @CurrentUser() user: User,
    @Param('id') workspaceId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.workspacesService.updateMemberRole(
      user.id,
      workspaceId,
      targetUserId,
      dto,
    );
  }

  // DELETE /workspaces/:id/members/:userId
  @Delete(':id/members/:userId')
  @ApiOperation({
    summary: 'Remover membro',
    description: 'Requer role OWNER ou ADMIN. Owner não pode ser removido.',
  })
  @ApiParam({ name: 'id', description: 'ID do workspace' })
  @ApiParam({ name: 'userId', description: 'ID do membro a ser removido' })
  @ApiResponse({ status: 200, description: 'Membro removido.' })
  @ApiResponse({ status: 403, description: 'Permissão insuficiente.' })
  @ApiResponse({ status: 404, description: 'Membro não encontrado.' })
  removeMember(
    @CurrentUser() user: User,
    @Param('id') workspaceId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.workspacesService.removeMember(
      user.id,
      workspaceId,
      targetUserId,
    );
  }
}
