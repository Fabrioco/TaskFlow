import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginUserDto } from './dtos/login-user.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateUserResponseDto } from './dtos/create-user-response.dto';
import type { Response, Request } from 'express';
import { User } from '../../generated/prisma';
import { TokenService } from '../../shared/jwt/token.service';

interface Cookies {
  [key: string]: string;
  refreshToken: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly service: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  // Configuração padrão do Cookie para reutilizar no código
  private readonly cookieOptions = {
    httpOnly: true, // Impede que scripts maliciosos (XSS) acessem o token
    secure: process.env.NODE_ENV === 'production', // Só trafega em HTTPS em produção
    sameSite: 'lax' as const, // Proteção contra CSRF
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias de expiração física no navegador
  };

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({ type: CreateUserDto })
  @ApiOperation({
    summary: 'Cadastro de novos usuários',
    description:
      'Cria um usuário, injeta o refresh token nos cookies seguros e retorna o access token.',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: CreateUserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email já Utilizado ou senhas não conferem',
  })
  @ApiResponse({ status: 400, description: 'Erro de validação dos campos' })
  async register(
    @Body() dto: CreateUserDto,
    @Res({ passthrough: true }) response: Response, // Injeta a resposta do Express
  ) {
    const { refresh_token, ...result } = await this.service.register(dto);

    // Envia o refresh token trancado no cookie
    response.cookie('refreshToken', refresh_token, this.cookieOptions);

    // Retorna apenas os dados do usuário e o access_token no JSON público
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginUserDto })
  @ApiOperation({
    summary: 'Login de um usuário',
    description:
      'Autentica o usuário, injeta o refresh token nos cookies seguros e retorna o access token.',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário logado com sucesso',
    type: CreateUserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { refresh_token, ...result } = await this.service.login(dto);

    response.cookie('refreshToken', refresh_token, this.cookieOptions);

    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar Access Token (Silent Refresh)',
    description:
      'Lê o refresh token dos cookies, valida-o e gera um novo par de tokens.',
  })
  @ApiResponse({ status: 200, description: 'Tokens renovados com sucesso' })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido, ausente ou revogado',
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const oldRefreshToken = (request.cookies as Cookies)['refreshToken'];

    // Decodifica o refresh token para pegar o userId sem validar a assinatura do access token
    const payload = this.tokenService.verifyRefreshToken(oldRefreshToken);
    const userId = payload?.id;

    const { refresh_token, access_token } = await this.service.refresh(
      userId,
      oldRefreshToken,
    );

    response.cookie('refreshToken', refresh_token, this.cookieOptions);
    return { access_token };
  }
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth() // Exige que o usuário envie o Access Token atual para saber quem está deslogando
  @ApiOperation({
    summary: 'Logout do sistema',
    description:
      'Invalida o token no banco de dados e limpa os cookies do navegador.',
  })
  @ApiResponse({ status: 200, description: 'Logout efetuado com sucesso' })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const userId = (request.user as User).id; // Seu Guard de autenticação normal vai injetar o request.user

    // Invalida no banco de dados pondo null no hashedRefreshToken
    await this.service.logout(userId);

    // Limpa o cookie do navegador
    response.clearCookie('refreshToken');

    return { message: 'Logout bem-sucedido' };
  }
}
