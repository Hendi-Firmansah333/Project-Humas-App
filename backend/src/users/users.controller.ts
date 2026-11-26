import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { ChangeMyPasswordDto } from './dto/change-my-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role, UserStatus } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Tambah personel baru (Admin Humas & Super Admin)' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Daftar semua personel kehumasan' })
  @ApiQuery({ name: 'role', enum: Role, required: false })
  @ApiQuery({ name: 'status', enum: UserStatus, required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('role') role?: Role,
    @Query('status') status?: UserStatus,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll(role, status, search);
  }

  @Get('me')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Profil dan ringkasan statistik akun yang sedang login' })
  getMe(@Request() req: any) {
    return this.usersService.getMyProfile(req.user.id);
  }

  @Patch('me')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Perbarui profil akun sendiri (termasuk foto avatar)' })
  updateMe(@Request() req: any, @Body() dto: UpdateMyProfileDto) {
    return this.usersService.updateMyProfile(req.user.id, req.user.role, dto);
  }

  @Patch('me/password')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.USER)
  @ApiOperation({ summary: 'Ubah kata sandi akun sendiri dengan verifikasi password lama' })
  changeMyPassword(@Request() req: any, @Body() dto: ChangeMyPasswordDto) {
    return this.usersService.changeMyPassword(req.user.id, dto);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Detail profil personel berdasarkan ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update informasi personel' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/password')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reset password personel oleh Admin Humas / Super Admin' })
  updatePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Hapus personel (Admin Humas & Super Admin)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
