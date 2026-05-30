import { IsEnum } from 'class-validator';
import { Role } from '../../../generated/prisma';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMemberRoleDto {
  @ApiProperty({
    enum: Role,
  })
  @IsEnum(Role)
  role: Role;

  constructor(role: Role) {
    this.role = role;
  }
}
