import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import * as bcrypt from 'bcrypt';
import { Role, UserStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: createUserDto.username },
          { email: createUserDto.email },
        ],
      },
    });
    if (existing) {
      throw new ConflictException('Username atau Email sudah terdaftar.');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        role: createUserDto.role || Role.USER,
        status: createUserDto.status || UserStatus.AKTIF,
      },
    });

    await this.prisma.notification.create({
      data: {
        title: 'Pengguna Baru Terdaftar',
        message: `${user.fullName} telah bergabung sebagai ${user.roleLabel || 'Personel Humas'}.`,
        type: 'SUCCESS',
      },
    });

    const { password, ...result } = user;
    return result;
  }

  async findAll(role?: Role, status?: UserStatus, search?: string) {
    const users = await this.prisma.user.findMany({
      where: {
        role: role || undefined,
        status: status || undefined,
        OR: search
          ? [
              { fullName: { contains: search } },
              { username: { contains: search } },
              { email: { contains: search } },
            ]
          : undefined,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => {
      const { password, ...result } = user;
      return result;
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`Personel dengan ID #${id} tidak ditemukan.`);
    }
    const { password, ...result } = user;
    return result;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    let hashedPassword: string | undefined = undefined;
    if (updateUserDto.password) {
      hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserDto,
        password: hashedPassword,
      },
    });

    const { password, ...result } = updated;
    return result;
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { message: `Personel ID #${id} berhasil dihapus.` };
  }

  async updatePassword(id: number, dto: UpdatePasswordDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password baru dan konfirmasi password tidak cocok.');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
    return { message: 'Password berhasil diperbarui.' };
  }
}
