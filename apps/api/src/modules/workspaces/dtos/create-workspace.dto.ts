import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({
    example: 'My Workspace',
    description: 'Nome do workspace',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    example: 'my-workspace',
    description: 'Slug do workspace',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug deve conter apenas letras minúsculas, números e hífens',
  })
  @MinLength(2)
  @MaxLength(50)
  slug: string;

  constructor(name: string, slug: string) {
    this.name = name;
    this.slug = slug;
  }
}
