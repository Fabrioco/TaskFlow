import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { execSync } from 'child_process';
import cookieParser from 'cookie-parser';
import { App } from 'supertest/types';
import { CryptoService } from '../../shared/crypto/crypto.service';

type RegisterResponse = {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  message?: string;
};

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  message?: string;
};

type PayloadDefault = {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

type RefreshResponse = {
  access_token: string;
  refresh_token: string;
  message?: string;
};

describe('Fluxo de Autenticação (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let cryptoService: CryptoService;

  const payloadDefault = {
    name: 'Fabrício Teste',
    email: 'fabricio@teste.com',
    password: 'password123',
    passwordConfirmation: 'password123',
  };

  const registerUser = (payload: PayloadDefault = payloadDefault) => {
    return request(app.getHttpServer() as App)
      .post('/auth/register')
      .send(payload);
  };

  // Executado UMA vez antes de todos os testes começarem
  beforeAll(async () => {
    // Força o Prisma a rodar as migrations no banco de testes para estruturar as tabelas
    process.env.NODE_ENV = 'test';
    execSync('npx prisma migrate reset --force', { env: process.env });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configura os mesmos middlewares do seu main.ts real
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe());

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    cryptoService = moduleFixture.get<CryptoService>(CryptoService);
    await app.init();
  });

  // Limpa o banco de dados APÓS cada teste para um teste não desconfigurar o outro
  afterEach(async () => {
    await prisma.user.deleteMany();
  });

  // Fecha a conexão após terminar tudo
  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('deve registrar usuário com dados válidos', async () => {
      const response = await registerUser();

      const body = response.body as RegisterResponse;

      expect(response).toBeDefined();
      expect(response.status).toBe(201); // Espera status 201 Created

      // Verifica se o corpo da resposta veio correto (Sem expor hashes)
      expect(body).toHaveProperty('access_token');
      expect(body.user).toMatchObject({
        name: payloadDefault.name,
        email: payloadDefault.email,
      });

      expect(body.user.id).toEqual(expect.any(String));

      // Verifica se o cookie "refreshToken" foi injetado nos headers de resposta
      const cookies: string[] = response.headers[
        'set-cookie'
      ] as unknown as string[];
      expect(cookies[0]).toContain('refreshToken=');
    });

    it('deve retornar 409 com email duplicado', async () => {
      await registerUser();

      const response = await registerUser();
      // Tenta criar de novo com o mesmo e-mail

      const body = response.body as RegisterResponse;

      expect(body.message).toBe('Email já utilizado');
    });

    it('deve retornar 409 com senhas diferentes', async () => {
      const response = await registerUser({
        ...payloadDefault,
        password: 'password123',
        passwordConfirmation: 'password456',
      });

      const body = response.body as RegisterResponse;

      expect(body.message).toBe('As senhas não conferem');
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await registerUser();
    });

    it('deve logar com credenciais válidas', async () => {
      const response = await request(app.getHttpServer() as App)
        .post('/auth/login')
        .send({
          email: payloadDefault.email,
          password: payloadDefault.password,
        })
        .expect(200);

      const body = response.body as LoginResponse;

      expect(response).toBeDefined();
      expect(response.status).toBe(200); // Espera status 200 OK

      // Verifica se o corpo da resposta veio correto (Sem expor hashes)
      expect(body).toHaveProperty('access_token');
      expect(body.user).toMatchObject({
        email: payloadDefault.email,
      });

      // Verifica se o cookie "refreshToken" foi injetado nos headers de resposta
      const cookies: string[] = response.headers[
        'set-cookie'
      ] as unknown as string[];
      expect(cookies[0]).toContain('refreshToken=');
    });

    it('deve retornar 401 com senha errada', async () => {
      const response = await request(app.getHttpServer() as App)
        .post('/auth/login')
        .send({ email: payloadDefault.email, password: 'password423' })
        .expect(401);

      const body = response.body as LoginResponse;

      expect(body.message).toBe('Credenciais inválidas');
    });

    it('deve retornar 401 com email inexistente', async () => {
      await registerUser();

      const response = await request(app.getHttpServer() as App)
        .post('/auth/login')
        .send({ email: 'V7A0d@example.com', password: payloadDefault.password })
        .expect(401);
      const body = response.body as LoginResponse;

      expect(body.message).toBe('Credenciais inválidas');
    });
  });

  describe('POST /auth/refresh', () => {
    it('deve atualizar o refresh token', async () => {
      const response = await registerUser();
      const cookies: string[] = response.headers[
        'set-cookie'
      ] as unknown as string[];
      const refreshToken = cookies[0].split('=')[1];

      const responseRefresh = await request(app.getHttpServer() as App)
        .post('/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .send()
        .expect(200);

      const body = responseRefresh.body as RefreshResponse;

      expect(body).toHaveProperty('access_token');
    });
  });
});
