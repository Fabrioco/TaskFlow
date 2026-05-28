import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { UpdateCommentDto } from './dtos/update-comment.dto';
import { Role } from '../../generated/prisma';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, taskId: string, dto: CreateCommentDto) {
    const task = await this.findTask(taskId);
    await this.ensureMember(userId, task.project.workspaceId);

    return this.prisma.comment.create({
      data: { content: dto.content, taskId, authorId: userId },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async findAll(userId: string, taskId: string) {
    const task = await this.findTask(taskId);
    await this.ensureMember(userId, task.project.workspaceId);

    return this.prisma.comment.findMany({
      where: { taskId },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(
    userId: string,
    taskId: string,
    commentId: string,
    dto: UpdateCommentDto,
  ) {
    const task = await this.findTask(taskId);
    await this.ensureMember(userId, task.project.workspaceId);

    const comment = await this.findComment(commentId, taskId);

    // só o autor pode editar
    if (comment.authorId !== userId) {
      throw new ForbiddenException('Apenas o autor pode editar o comentário');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async remove(userId: string, taskId: string, commentId: string) {
    const task = await this.findTask(taskId);
    const member = await this.ensureMember(userId, task.project.workspaceId);
    const comment = await this.findComment(commentId, taskId);

    // autor pode deletar o próprio comentário; OWNER/ADMIN podem deletar qualquer um
    const isAuthor = comment.authorId === userId;
    const isPrivileged = [Role.OWNER, Role.ADMIN, Role.MEMBER].includes(
      member.role,
    );

    if (!isAuthor && !isPrivileged) {
      throw new ForbiddenException(
        'Sem permissão para deletar este comentário',
      );
    }

    return this.prisma.comment.delete({ where: { id: commentId } });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async findTask(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, project: { select: { workspaceId: true } } },
    });
    if (!task) throw new NotFoundException('Task não encontrada');
    return task;
  }

  private async findComment(commentId: string, taskId: string) {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, taskId },
    });
    if (!comment) throw new NotFoundException('Comentário não encontrado');
    return comment;
  }

  private async ensureMember(userId: string, workspaceId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
    if (!member) throw new ForbiddenException('Sem acesso a este workspace');
    return member;
  }
}
