import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dtos/create-task.dto';
import { UpdateTaskDto } from './dtos/update-task.dto';
import { ListTasksDto } from './dtos/list-tasks.dto';
import { ReorderTasksDto } from './dtos/reorder-tasks.dto';
import { Role } from '../../generated/prisma';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Tasks ───────────────────────────────────────────────────────────────────

  async create(userId: string, projectId: string, dto: CreateTaskDto) {
    const project = await this.findProject(projectId);
    await this.ensureMember(userId, project.workspaceId);

    // pega o maior order atual pra inserir no fim
    const last = await this.prisma.task.findFirst({
      where: { projectId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    return this.prisma.task.create({
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        projectId,
        order: (last?.order ?? -1) + 1,
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async findAll(userId: string, projectId: string, filters: ListTasksDto) {
    const project = await this.findProject(projectId);
    await this.ensureMember(userId, project.workspaceId);

    return this.prisma.task.findMany({
      where: {
        projectId,
        ...(filters.status && { status: filters.status }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.assigneeId && { assigneeId: filters.assigneeId }),
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(userId: string, projectId: string, taskId: string) {
    const project = await this.findProject(projectId);
    await this.ensureMember(userId, project.workspaceId);

    const task = await this.prisma.task.findFirst({
      where: { id: taskId, projectId },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { comments: true } },
      },
    });

    if (!task) throw new NotFoundException('Task não encontrada');
    return task;
  }

  async update(
    userId: string,
    projectId: string,
    taskId: string,
    dto: UpdateTaskDto,
  ) {
    const project = await this.findProject(projectId);
    await this.ensureMember(userId, project.workspaceId);
    await this.findOne(userId, projectId, taskId);

    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : dto.dueDate,
      },
      include: {
        assignee: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async remove(userId: string, projectId: string, taskId: string) {
    const project = await this.findProject(projectId);
    await this.ensureRole(userId, project.workspaceId, [
      Role.OWNER,
      Role.ADMIN,
    ]);
    await this.findOne(userId, projectId, taskId);

    return this.prisma.task.delete({ where: { id: taskId } });
  }

  async reorder(userId: string, projectId: string, dto: ReorderTasksDto) {
    const project = await this.findProject(projectId);
    await this.ensureMember(userId, project.workspaceId);

    // valida que todos os ids pertencem ao projeto
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      select: { id: true },
    });

    const existingIds = new Set(tasks.map((t) => t.id));
    const invalid = dto.orderedIds.filter((id) => !existingIds.has(id));
    if (invalid.length > 0) {
      throw new BadRequestException(`IDs inválidos: ${invalid.join(', ')}`);
    }

    // atualiza o order de cada task em paralelo
    await this.prisma.$transaction(
      dto.orderedIds.map((id, index) =>
        this.prisma.task.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    return { reordered: dto.orderedIds.length };
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async findProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, workspaceId: true, archived: true },
    });
    if (!project) throw new NotFoundException('Projeto não encontrado');
    return project;
  }

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
