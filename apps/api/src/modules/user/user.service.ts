import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UploadImageService } from '../upload-image/upload-image.service';
import { Prisma } from '../../generated/prisma';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadImage: UploadImageService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      omit: { passwordHash: true, refreshTokenHash: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async updateProfile(dto: UpdateProfileDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const { avatar, ...restOfDto } = dto;

    // Inicializamos o objeto explicitando que podemos manipular suas chaves como string
    const dataToUpdate: Prisma.UserUpdateInput & Record<string, any> = {};

    // Filtra campos de texto vazios enviados pelo formulário
    for (const [key, value] of Object.entries(restOfDto)) {
      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ''
      ) {
        dataToUpdate[key] = value;
      }
    }

    // Se houver arquivo, faz upload e anexa a URL com timestamp à carga do Prisma
    if (avatar) {
      const avatarUrl = await this.uploadImage.uploadAvatar(
        userId,
        avatar.buffer,
        avatar.mimetype,
      );

      dataToUpdate.avatarUrl = avatarUrl;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return user;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      omit: { passwordHash: true, refreshTokenHash: true },
    });

    return updatedUser;
  }
}
