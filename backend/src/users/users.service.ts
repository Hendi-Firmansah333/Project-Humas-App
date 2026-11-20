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

  private getDefaultRoleLabel(role: Role): string {
    switch (role) {
      case Role.SUPER_ADMIN:
        return 'Kepala Humas';
      case Role.ADMIN:
        return 'Admin Humas';
      case Role.USER:
      default:
        return 'Anggota Humas';
    }
  }

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

    const targetRole = createUserDto.role || Role.USER;

    if (targetRole === Role.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { role: Role.ADMIN, deletedAt: null },
      });
      if (adminCount >= 1) {
        throw new BadRequestException('Tidak dapat menambahkan Admin Humas baru. Hanya boleh ada satu akun Admin Humas di sistem.');
      }
    }

    if (targetRole === Role.SUPER_ADMIN) {
      const superAdminCount = await this.prisma.user.count({
        where: { role: Role.SUPER_ADMIN, deletedAt: null },
      });
      if (superAdminCount >= 1) {
        throw new BadRequestException('Tidak dapat menambahkan Kepala Humas baru. Hanya boleh ada satu akun Kepala Humas di sistem.');
      }
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
        role: targetRole,
        roleLabel: createUserDto.roleLabel || this.getDefaultRoleLabel(targetRole),
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
        deletedAt: null,
        role: role || undefined,
        status: status || undefined,
        AND: search
          ? {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
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
    if (!user || user.deletedAt !== null) {
      throw new NotFoundException(`Personel dengan ID #${id} tidak ditemukan.`);
    }
    const { password, ...result } = user;
    return result;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser || existingUser.deletedAt !== null) {
      throw new NotFoundException(`Personel dengan ID #${id} tidak ditemukan.`);
    }

    if (updateUserDto.username || updateUserDto.email) {
      const conflictConditions = [
        updateUserDto.username ? { username: updateUserDto.username } : undefined,
        updateUserDto.email ? { email: updateUserDto.email } : undefined,
      ].filter(Boolean) as any[];

      if (conflictConditions.length > 0) {
        const conflictUser = await this.prisma.user.findFirst({
          where: {
            id: { not: id },
            OR: conflictConditions,
          },
        });
        if (conflictUser) {
          throw new ConflictException('Username atau Email sudah digunakan oleh akun lain.');
        }
      }
    }

    if (updateUserDto.role) {
      if (updateUserDto.role === Role.ADMIN && existingUser.role !== Role.ADMIN) {
        const adminCount = await this.prisma.user.count({
          where: { role: Role.ADMIN, deletedAt: null },
        });
        if (adminCount >= 1) {
          throw new BadRequestException('Hanya boleh ada satu akun Admin Humas di sistem.');
        }
      }

      if (updateUserDto.role !== Role.ADMIN && existingUser.role === Role.ADMIN) {
        const adminCount = await this.prisma.user.count({
          where: { role: Role.ADMIN, deletedAt: null },
        });
        if (adminCount <= 1) {
          throw new BadRequestException('Tidak dapat mengubah role satu-satunya akun Admin Humas.');
        }
      }

      if (updateUserDto.role === Role.SUPER_ADMIN && existingUser.role !== Role.SUPER_ADMIN) {
        const superAdminCount = await this.prisma.user.count({
          where: { role: Role.SUPER_ADMIN, deletedAt: null },
        });
        if (superAdminCount >= 1) {
          throw new BadRequestException('Hanya boleh ada satu akun Kepala Humas di sistem.');
        }
      }

      if (updateUserDto.role !== Role.SUPER_ADMIN && existingUser.role === Role.SUPER_ADMIN) {
        const superAdminCount = await this.prisma.user.count({
          where: { role: Role.SUPER_ADMIN, deletedAt: null },
        });
        if (superAdminCount <= 1) {
          throw new BadRequestException('Tidak dapat mengubah role Kepala Humas (Super Admin) terakhir.');
        }
      }
    }

    let hashedPassword: string | undefined = undefined;
    if (updateUserDto.password) {
      hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
    }

    const resultingRole = updateUserDto.role || existingUser.role;
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateUserDto,
        roleLabel: updateUserDto.role ? (updateUserDto.roleLabel || this.getDefaultRoleLabel(updateUserDto.role)) : updateUserDto.roleLabel,
        password: hashedPassword,
      },
    });

    if (resultingRole === Role.ADMIN || resultingRole === Role.SUPER_ADMIN) {
      await this.prisma.location.deleteMany({ where: { userId: id } });
    }

    const { password, ...result } = updated;
    return result;
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.deletedAt !== null) {
      throw new NotFoundException(`Personel dengan ID #${id} tidak ditemukan.`);
    }

    if (user.role === Role.SUPER_ADMIN) {
      const superAdminCount = await this.prisma.user.count({
        where: { role: Role.SUPER_ADMIN, deletedAt: null },
      });
      if (superAdminCount <= 1) {
        throw new BadRequestException('Tidak dapat menghapus Kepala Humas (Super Admin) terakhir.');
      }
    }

    if (user.role === Role.ADMIN) {
      const adminCount = await this.prisma.user.count({
        where: { role: Role.ADMIN, deletedAt: null },
      });
      if (adminCount <= 1) {
        throw new BadRequestException('Tidak dapat menghapus satu-satunya akun Admin Humas.');
      }
    }

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: `Personel ID #${id} berhasil dihapus.` };
  }

  async updatePassword(id: number, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException(`Personel dengan ID #${id} tidak ditemukan.`);
    }
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
