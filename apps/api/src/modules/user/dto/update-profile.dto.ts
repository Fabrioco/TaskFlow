import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Nome do usuário',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O campo "name" deve ser uma string' })
  name?: string;

  @ApiProperty({
    example: 'gYKlD@example.com',
    description: 'Email do usuário',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O campo "email" deve ser um email valido' })
  email?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Arquivo de imagem para o avatar (png, jpg, jpeg)',
    required: false,
  })
  @IsOptional()
  avatar?: Express.Multer.File;
}
