import {
  Controller,
  Patch,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../shared/decorator/current-user.decorator';
import type { User } from '../../generated/prisma';
import { UploadImageService } from './upload-image.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@Controller('upload-image')
@ApiTags('Upload Image')
@UseGuards(JwtAuthGuard)
export class UploadImageController {
  constructor(private readonly service: UploadImageService) {}

  @Patch('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File, // 👈 Alterado aqui
  ) {
    const url = await this.service.uploadAvatar(
      user.id,
      file.buffer,
      file.mimetype,
    );
    return { url };
  }
}
