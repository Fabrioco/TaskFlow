import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiConsumes, // 👈 Adicionado para o Swagger
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express'; // 👈 Adicionado
import { UserService } from './user.service';
import { CurrentUser } from '../../shared/decorator/current-user.decorator';
import type { User } from '../../generated/prisma';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('user')
@ApiTags('Usuários')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Retorna o perfil do usuário' })
  @ApiResponse({ status: 200, description: 'Perfil do usuário' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async getProfile(@CurrentUser() user: User) {
    return this.service.getProfile(user.id);
  }

  @Patch('profile')
  @UseInterceptors(FileInterceptor('avatar')) // 👈 Captura o arquivo enviado no campo 'avatar'
  @ApiConsumes('multipart/form-data') // 👈 Avisa o Swagger que a requisição aceita arquivos binários
  @ApiBody({ type: UpdateProfileDto })
  @ApiOperation({ summary: 'Atualiza o perfil do usuário' })
  @ApiResponse({ status: 200, description: 'Perfil do usuário atualizado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File, // 👈 Captura o arquivo opcional
  ) {
    // Injeta o arquivo capturado diretamente para dentro do DTO antes de mandar pro service
    if (file) {
      dto.avatar = file;
    }

    return this.service.updateProfile(dto, user.id);
  }
}
