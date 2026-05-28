import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({ example: 'Conteúdo atualizado do comentário.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  constructor(content: string) {
    this.content = content;
  }
}
