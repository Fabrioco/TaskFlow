import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Nome do usuário',
    required: true,
  })
  @IsString({ message: 'O campo "name" deve ser uma string' })
  @IsNotEmpty({ message: 'O campo "name" deve ser preenchido' })
  name!: string;

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
  @IsString({ message: 'O campo "password" deve ser uma string' })
  @IsNotEmpty({ message: 'O campo "password" deve ser preenchido' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
    message:
      'O campo "password" deve conter pelo menos 8 caracteres, incluindo pelo menos uma letra e um número',
  })
  password!: string;

  @ApiProperty({
    example: 'password123',
    description: 'Confirmação de senha do usuário',
    required: true,
  })
  @IsString({ message: 'O campo "passwordConfirmation" deve ser uma string' })
  @IsNotEmpty({ message: 'O campo "passwordConfirmation" deve ser preenchido' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
    message:
      'O campo "passwordConfirmation" deve conter pelo menos 8 caracteres, incluindo pelo menos uma letra e um número',
  })
  passwordConfirmation!: string;
}
