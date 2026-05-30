import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dtos/create-workspace.dto';
import { UpdateWorkspaceDto } from './dtos/update-workspace.dto';
import { InviteMemberDto } from './dtos/invite-member.dto';
import { UpdateMemberRoleDto } from './dtos/update-member-role.dto';
import { Role } from '../../generated/prisma';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Workspaces ─────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateWorkspaceDto) {
    const slugTaken = await this.prisma.workspace.findUnique({
      where: { slug: dto.slug },
    });
    if (slugTaken) throw new ConflictException('Slug já está em uso');

    return this.prisma.workspace.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        members: {
          create: { userId, role: Role.OWNER },
        },
      },
      include: { members: true },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.workspace.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        _count: { select: { members: true, projects: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(userId: string, slug: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        _count: { select: { projects: true } },
      },
    });
    if (!workspace) throw new NotFoundException('Workspace não encontrado');

    const isMember = workspace.members.some((m) => m.userId === userId);
    if (!isMember) throw new ForbiddenException('Sem acesso a este workspace');

    return workspace;
  }

  async update(userId: string, workspaceId: string, dto: UpdateWorkspaceDto) {
    await this.ensureRole(userId, workspaceId, [Role.OWNER, Role.ADMIN]);

    if (dto.slug) {
      const slugTaken = await this.prisma.workspace.findFirst({
        where: { slug: dto.slug, NOT: { id: workspaceId } },
      });
      if (slugTaken) throw new ConflictException('Slug já está em uso');
    }

    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: dto,
    });
  }

  async remove(userId: string, workspaceId: string) {
    await this.ensureRole(userId, workspaceId, [Role.OWNER]);

    return this.prisma.workspace.delete({ where: { id: workspaceId } });
  }

  // ─── Members ─────────────────────────────────────────────────────────────────

  async inviteMember(
    userId: string,
    workspaceId: string,
    dto: InviteMemberDto,
  ) {
    await this.ensureRole(userId, workspaceId, [Role.OWNER, Role.ADMIN]);

    const target = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!target) throw new NotFoundException('Usuário não encontrado');

    const alreadyMember = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: target.id, workspaceId } },
    });
    if (alreadyMember) throw new ConflictException('Usuário já é membro');

    return this.prisma.workspaceMember.create({
      data: { userId: target.id, workspaceId, role: Role.MEMBER },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async listMembers(userId: string, workspaceId: string) {
    await this.ensureMember(userId, workspaceId);

    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async updateMemberRole(
    userId: string,
    workspaceId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
  ) {
    await this.ensureRole(userId, workspaceId, [Role.OWNER]);

    if (targetUserId === userId)
      throw new ForbiddenException('Não é possível alterar seu próprio role');
    if (dto.role === Role.OWNER)
      throw new ForbiddenException(
        'Não é possível transferir ownership por esta rota',
      );

    const member = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
    });
    if (!member) throw new NotFoundException('Membro não encontrado');

    return this.prisma.workspaceMember.update({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
      data: { role: dto.role },
    });
  }

  async removeMember(
    userId: string,
    workspaceId: string,
    targetUserId: string,
  ) {
    await this.ensureRole(userId, workspaceId, [Role.OWNER, Role.ADMIN]);

    if (targetUserId === userId)
      throw new ForbiddenException(
        'Use a rota de deleção de conta para sair do workspace',
      );

    const member = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
    });
    if (!member) throw new NotFoundException('Membro não encontrado');
    if (member.role === Role.OWNER)
      throw new ForbiddenException('Não é possível remover o owner');

    return this.prisma.workspaceMember.delete({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async ensureMember(userId: string, workspaceId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!member) throw new ForbiddenException('Sem acesso a este workspace');
    return member;
  }

  private async ensureRole(userId: string, workspaceId: string, roles: Role[]) {
    const member = await this.ensureMember(userId, workspaceId);
    if (!roles.includes(member.role)) {
      throw new ForbiddenException('Permissão insuficiente');
    }
    return member;
  }
}
