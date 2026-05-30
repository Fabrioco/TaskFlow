import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListProjectsDto {
  @ApiPropertyOptional({ example: false, description: 'Filtrar projetos arquivados. Se omitido, retorna apenas ativos.' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  archived?: boolean;
}
