import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    example: 'gYKlD@example.com',
    description: 'Email do usuário',
    required: true,
  })
  @IsEmail({}, { message: 'O campo "email" deve ser um email valido' })
  @IsNotEmpty({ message: 'O campo "email" deve ser preenchido' })
  email!: string;

  @ApiProperty({
    example: 'password123',
    description: 'Senha do usuário',
    required: true,
  })
  @IsNotEmpty({ message: 'O campo "password" deve ser preenchido' })
  @IsString({ message: 'O campo "password" deve ser uma string' })
  password!: string;
}
