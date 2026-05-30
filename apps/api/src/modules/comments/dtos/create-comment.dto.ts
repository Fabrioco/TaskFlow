import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Precisamos revisar esse ponto antes de mergear.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  constructor(content: string) {
    this.content = content;
  }
}
