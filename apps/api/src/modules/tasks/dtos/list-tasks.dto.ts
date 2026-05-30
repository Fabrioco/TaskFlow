import { ApiPropertyOptional } from '@nestjs/swagger';
import { TaskStatus, Priority } from '../../../generated/prisma';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class ListTasksDto {
  @ApiPropertyOptional({ enum: TaskStatus, example: TaskStatus.TODO })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ enum: Priority, example: Priority.HIGH })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({
    example: 'uuid-do-usuario',
    description: 'Filtrar por responsável',
  })
  @IsUUID()
  @IsOptional()
  assigneeId?: string;
}
