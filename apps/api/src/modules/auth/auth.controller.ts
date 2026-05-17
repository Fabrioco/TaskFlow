import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dtos/create-user.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserResponseDto } from './dtos/create-user-response.dto';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({
    type: CreateUserDto,
  })
  @ApiOperation({
    summary: 'Cadastro de novos usuários',
    description:
      'Recebe os dados do DTO, cria um usuário e retorna o token com as informações do usuário',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: CreateUserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email já Utilizado',
  })
  @ApiResponse({
    status: 409,
    description: 'As senhas não conferem',
  })
  @ApiResponse({
    status: 400,
    description: 'O campo "TAL" está faltando',
  })
  async register(@Body() dto: CreateUserDto) {
    return this.service.register(dto);
  }
}
