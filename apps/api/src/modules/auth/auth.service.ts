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
      throw new ConflictException('Email já Utilizado');
    }

    const passwordHash = await this.cryptoService.hash(dto.password);

    const newUser = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
      },
    });

    const token = this.tokenService.generateAccessToken(newUser);

    return {
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
      token,
    };
  }

  async login(dto: LoginUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

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

    const token = this.tokenService.generateAccessToken(user);

    return {
      user: { id: user.id, name: user.name, email: user.email },
      access_token: token,
    };
  }
}
