import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CryptoService } from '../../shared/crypto/crypto.service';
import { TokenService } from '../../shared/jwt/token.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginUserDto } from './dtos/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: CryptoService,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: CreateUserDto) {
    if (dto.password !== dto.passwordConfirmation) {
      throw new ConflictException('As senhas não conferem');
    }

    const emailExists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (emailExists) {
      throw new ConflictException('Email já utilizado');
    }

    const passwordHash = await this.cryptoService.hash(dto.password);

    const newUser = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, passwordHash },
      // Seleciona só o necessário — nunca retorna passwordHash ou refreshTokenHash
      select: { id: true, name: true, email: true },
    });

    const tokens = await this.generateAndSaveTokens(newUser.id, newUser.email);

    return { user: newUser, ...tokens };
  }

  async login(dto: LoginUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Mesma mensagem para usuário não encontrado e senha errada
    // Evita enumeration attack — atacante não sabe se o email existe
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await this.cryptoService.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tokens = await this.generateAndSaveTokens(user.id, user.email);

    return {
      user: { id: user.id, name: user.name, email: user.email },
      ...tokens,
    };
  }

  async refresh(userId: string, refreshToken: string) {
    // Busca só os campos necessários para validação
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, refreshTokenHash: true },
    });

    // Mesma exceção para usuário não encontrado e token nulo (logout anterior)
    // Evita que o atacante saiba se o userId existe
    if (!user?.refreshTokenHash) {
      throw new UnauthorizedException('Acesso negado');
    }

    const isRefreshTokenValid = await this.cryptoService.compare(
      refreshToken,
      user.refreshTokenHash,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Token inválido ou revogado');
    }

    return this.generateAndSaveTokens(user.id, user.email);
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  private async generateAndSaveTokens(userId: string, email: string) {
    const accessToken = this.tokenService.generateAccessToken({
      id: userId,
      email,
    });
    const refreshToken = this.tokenService.generateRefreshToken({
      id: userId,
      email,
    });

    const hashedRefreshToken = await this.cryptoService.hash(refreshToken);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hashedRefreshToken },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}
