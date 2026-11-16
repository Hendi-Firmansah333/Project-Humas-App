import { Injectable, UnauthorizedException, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

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
    const user = await this.prisma.user.findUnique({
      where: { username: loginDto.username },
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
    return userInfo;
  }
}
