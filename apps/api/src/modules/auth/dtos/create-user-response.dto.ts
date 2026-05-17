import { ApiProperty } from '@nestjs/swagger';

export class CreateUserResponseDto {
  @ApiProperty({
    example: {
      id: '123e4567-e89b-12d3-a456-426655440000',
      email: 'gYKlD@example.com',
      name: 'John Doe',
    },
  })
  user!: {
    id: string;
    email: string;
    name: string;
  };

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426655440000',
    description: 'Token de autenticação',
  })
  token!: string;
}
