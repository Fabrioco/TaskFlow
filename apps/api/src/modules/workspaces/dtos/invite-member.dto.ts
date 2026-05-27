import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class InviteMemberDto {
  @ApiProperty({
    example: 'fabriciooliveiralopes50@gmail.com',
    description: 'Email do usuário',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  constructor(email: string) {
    this.email = email;
  }
}
