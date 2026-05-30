import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateWorkspaceDto {
  @ApiProperty({
    example: 'My Workspace',
    description: 'Nome do workspace',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @ApiProperty({
    example: 'my-workspace',
    description: 'Slug do workspace',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug deve conter apenas letras minúsculas, números e hífens',
  })
  @MinLength(2)
  @MaxLength(50)
  slug?: string;
}
