import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { ChangeMyPasswordDto } from './dto/change-my-password.dto';
import { RealtimeEventsService } from '../events/realtime-events.service';
import * as bcrypt from 'bcrypt';
import { Role, UserStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    @Optional() private eventsService?: RealtimeEventsService,
  ) {}

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

    if (updateUserDto.role && updateUserDto.role !== Role.SUPER_ADMIN && existingUser.role === Role.SUPER_ADMIN) {
      const superAdminCount = await this.prisma.user.count({
        where: { role: Role.SUPER_ADMIN, deletedAt: null },
      });
      if (superAdminCount <= 1) {
        throw new BadRequestException('Tidak dapat mengubah role Kepala Humas (Super Admin) terakhir.');
      }
    }

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

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
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

  async getMyProfile(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt !== null) {
      throw new NotFoundException('Profil pengguna tidak ditemukan.');
    }

    const isMember = user.role === Role.USER;
    const [activities, contentPlans, loans] = await Promise.all([
      this.prisma.activity.count({
        where: {
          deletedAt: null,
          ...(isMember ? { OR: [{ picId: userId }, { members: { some: { userId } } }] } : {}),
        },
      }),
      this.prisma.contentPlan.count({
        where: {
          deletedAt: null,
          ...(isMember ? { picId: userId } : {}),
        },
      }),
      this.prisma.equipmentLoan.count({
        where: {
          deletedAt: null,
          ...(isMember ? { userId } : {}),
        },
      }),
    ]);

    const { password, ...result } = user;
    return {
      ...result,
      stats: { activities, contentPlans, loans },
    };
  }

  async updateMyProfile(userId: number, role: Role, dto: UpdateMyProfileDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser || existingUser.deletedAt !== null) {
      throw new NotFoundException('Profil pengguna tidak ditemukan.');
    }

    const isAdmin = role === Role.ADMIN || role === Role.SUPER_ADMIN;
    if (!isAdmin) {
      if (dto.username !== undefined && dto.username.trim() !== existingUser.username) {
        throw new ForbiddenException('Anggota tidak dapat mengubah username secara mandiri.');
      }
      if (
        dto.email !== undefined &&
        dto.email.trim().toLowerCase() !== existingUser.email.toLowerCase()
      ) {
        throw new ForbiddenException('Anggota tidak dapat mengubah email akun secara mandiri.');
      }
    }

    const data: Record<string, string | null> = {};

    if (dto.fullName !== undefined) {
      const trimmedName = dto.fullName.trim();
      if (trimmedName.length < 3) {
        throw new BadRequestException('Nama lengkap minimal harus 3 karakter.');
      }
      data.fullName = trimmedName;
    }

    if (dto.phone !== undefined) {
      const trimmedPhone = dto.phone.trim();
      data.phone = trimmedPhone || null;
    }

    if (dto.avatar !== undefined) {
      if (dto.avatar === null || dto.avatar.trim() === '') {
        data.avatar = null;
      } else {
        const trimmedAvatar = dto.avatar.trim();
        if (!trimmedAvatar.startsWith('https://') && !trimmedAvatar.startsWith('http://')) {
          throw new BadRequestException('URL foto profil harus diawali http:// atau https://.');
        }
        data.avatar = trimmedAvatar;
      }
    }

    if (isAdmin && dto.username !== undefined) {
      const nextUsername = dto.username.trim();
      if (nextUsername.length < 3) {
        throw new BadRequestException('Username minimal harus 3 karakter.');
      }
      if (nextUsername !== existingUser.username) {
        const usernameConflict = await this.prisma.user.findFirst({
          where: { id: { not: userId }, username: nextUsername },
        });
        if (usernameConflict) {
          throw new ConflictException('Username sudah digunakan oleh pengguna lain.');
        }
        data.username = nextUsername;
      }
    }

    if (isAdmin && dto.email !== undefined) {
      const nextEmail = dto.email.trim().toLowerCase();
      if (nextEmail !== existingUser.email.toLowerCase()) {
        const emailConflict = await this.prisma.user.findFirst({
          where: { id: { not: userId }, email: { equals: nextEmail, mode: 'insensitive' } },
        });
        if (emailConflict) {
          throw new ConflictException('Email sudah digunakan oleh pengguna lain.');
        }
        data.email = nextEmail;
      }
    }

    const updated =
      Object.keys(data).length > 0
        ? await this.prisma.user.update({ where: { id: userId }, data })
        : existingUser;

    this.eventsService?.emit('teamLocations', 'profile_updated', userId);

    const { password, ...result } = updated;
    return result;
  }

  async changeMyPassword(userId: number, dto: ChangeMyPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt !== null) {
      throw new NotFoundException('Pengguna tidak ditemukan.');
    }

    const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isCurrentValid) {
      throw new BadRequestException('Kata sandi saat ini tidak sesuai.');
    }

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password baru dan konfirmasi password tidak cocok.');
    }

    if (dto.password === dto.currentPassword) {
      throw new BadRequestException('Password baru harus berbeda dari kata sandi saat ini.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Kata sandi berhasil diperbarui.' };
  }
}
