import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectDto } from './dtos/update-project.dto';
import { ListProjectsDto } from './dtos/list-projects.dto';
import { Role } from '../../generated/prisma';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Projects ────────────────────────────────────────────────────────────────

  async create(userId: string, workspaceId: string, dto: CreateProjectDto) {
    await this.ensureRole(userId, workspaceId, [Role.OWNER, Role.ADMIN]);

    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        workspaceId,
      },
    });
  }

  async findAll(userId: string, workspaceId: string, filters: ListProjectsDto) {
    await this.ensureMember(userId, workspaceId);

    return this.prisma.project.findMany({
      where: {
        workspaceId,
        archived: filters.archived ?? false,
      },
      include: {
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, workspaceId: string, projectId: string) {
    await this.ensureMember(userId, workspaceId);

    const project = await this.prisma.project.findFirst({
      where: { id: projectId, workspaceId },
      include: {
        _count: { select: { tasks: true } },
      },
    });

    if (!project) throw new NotFoundException('Projeto não encontrado');

    return project;
  }

  async update(
    userId: string,
    workspaceId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ) {
    await this.ensureRole(userId, workspaceId, [Role.OWNER, Role.ADMIN]);
    await this.findOne(userId, workspaceId, projectId);

    return this.prisma.project.update({
      where: { id: projectId },
      data: dto,
    });
  }

  async remove(userId: string, workspaceId: string, projectId: string) {
    await this.ensureRole(userId, workspaceId, [Role.OWNER]);
    await this.findOne(userId, workspaceId, projectId);

    return this.prisma.project.delete({ where: { id: projectId } });
  }

  async archive(userId: string, workspaceId: string, projectId: string) {
    await this.ensureRole(userId, workspaceId, [Role.OWNER, Role.ADMIN]);

    const project = await this.findOne(userId, workspaceId, projectId);

    return this.prisma.project.update({
      where: { id: projectId },
      data: { archived: !project.archived },
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
