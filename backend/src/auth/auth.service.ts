import { Injectable, UnauthorizedException, OnModuleInit, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    if (
      process.env['VERCEL'] === '1' ||
      process.env['NODE_ENV'] === 'production' ||
      process.env['SKIP_AUTH_SEED'] === 'true'
    ) {
      return;
    }

    try {
      // Seed default Admin Humas user if not exists (hanya development lokal)
      const adminCount = await this.prisma.user.count({ where: { username: 'komang.ari' } });
      if (adminCount === 0) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await this.prisma.user.create({
          data: {
            fullName: 'Komang Ari',
            username: 'komang.ari',
            email: 'komang.ari@polinela.ac.id',
            phone: '0812-3456-7890',
            password: hashedPassword,
            role: 'ADMIN',
            roleLabel: 'Admin Humas',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            status: 'AKTIF',
          },
        });
      }
    } catch {
      // Abaikan error DB saat boot awal agar endpoint health tetap bisa merespons
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: loginDto.username },
          { email: loginDto.username },
        ],
      },
    });

    if (!user || user.deletedAt !== null) {
      throw new UnauthorizedException('Username atau password salah.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Username atau password salah.');
    }

    if (user.status === 'NONAKTIF') {
      throw new UnauthorizedException('Akun Anda dinonaktifkan.');
    }

    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    const { password, ...userInfo } = user;
    return {
      message: 'Login berhasil',
      accessToken,
      token: accessToken,
      user: userInfo,
    };
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password, ...userInfo } = user;

    let liputan = 0;
    let publikasi = 0;
    let peminjaman = 0;

    if (user.role === Role.USER) {
      [liputan, publikasi, peminjaman] = await Promise.all([
        this.prisma.activity.count({
          where: {
            deletedAt: null,
            OR: [{ picId: userId }, { members: { some: { userId } } }],
          },
        }),
        this.prisma.contentPlan.count({
          where: {
            deletedAt: null,
            picId: userId,
          },
        }),
        this.prisma.equipmentLoan.count({
          where: {
            deletedAt: null,
            OR: [
              { userId },
              { borrowerName: { equals: user.fullName, mode: 'insensitive' } },
            ],
          },
        }),
      ]);
    } else {
      [liputan, publikasi, peminjaman] = await Promise.all([
        this.prisma.activity.count({
          where: { deletedAt: null },
        }),
        this.prisma.contentPlan.count({
          where: { deletedAt: null },
        }),
        this.prisma.equipmentLoan.count({
          where: { deletedAt: null },
        }),
      ]);
    }

    return {
      ...userInfo,
      stats: {
        liputan,
        publikasi,
        peminjaman,
      },
    };
  }

  async updateProfile(userId: number, body: { fullName?: string; username?: string; email?: string; phone?: string; nip?: string; avatar?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    if (body.username && body.username.trim() && body.username.trim().toLowerCase() !== user.username.toLowerCase()) {
      const cleanUsername = body.username.trim();
      const existingUsername = await this.prisma.user.findFirst({
        where: { username: { equals: cleanUsername, mode: 'insensitive' }, id: { not: userId } },
      });
      if (existingUsername) {
        throw new BadRequestException('Username sudah terdaftar oleh pengguna lain');
      }
    }

    if (body.email && body.email.trim() && body.email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const cleanEmail = body.email.trim();
      const existingEmail = await this.prisma.user.findFirst({
        where: { email: { equals: cleanEmail, mode: 'insensitive' }, id: { not: userId } },
      });
      if (existingEmail) {
        throw new BadRequestException('Email sudah terdaftar oleh pengguna lain');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(body.fullName && body.fullName.trim() ? { fullName: body.fullName.trim() } : {}),
        ...(body.username && body.username.trim() ? { username: body.username.trim() } : {}),
        ...(body.email && body.email.trim() ? { email: body.email.trim() } : {}),
        ...(body.phone !== undefined ? { phone: body.phone.trim() } : {}),
        ...(body.nip !== undefined ? { nip: body.nip.trim() } : {}),
        ...(body.avatar !== undefined ? { avatar: body.avatar } : {}),
      },
    });

    const { password, ...userInfo } = updated;
    return userInfo;
  }

  async changePassword(userId: number, body: { currentPassword: string; newPassword: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const isMatch = await bcrypt.compare(body.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Kata sandi saat ini tidak cocok.');
    }

    const hashedPassword = await bcrypt.hash(body.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Kata sandi berhasil diperbarui' };
  }
}
