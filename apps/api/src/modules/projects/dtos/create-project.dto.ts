import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Site institucional', description: 'Nome do projeto' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Redesign completo do site da empresa', description: 'Descrição opcional do projeto' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
