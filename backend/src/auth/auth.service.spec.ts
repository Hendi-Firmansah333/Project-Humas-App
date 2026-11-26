import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService Security', () => {
  let authService: AuthService;
  let prisma: { user: { findFirst: jest.Mock; count: jest.Mock; create: jest.Mock } };
  let jwtService: { sign: jest.Mock };
  let realPasswordHash: string;

  beforeAll(async () => {
    realPasswordHash = await bcrypt.hash('P@ssw0rdAman!', 4);
  });

  beforeEach(() => {
    prisma = {
      user: {
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('signed.jwt.token'),
    };
    authService = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
    );
  });

  it('rejects master fallback password "admin123" when account password differs', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 1,
      username: 'kepala.humas',
      password: realPasswordHash,
      fullName: 'Kepala Humas',
      role: Role.SUPER_ADMIN,
      roleLabel: 'Kepala Humas',
      avatar: null,
      status: 'AKTIF',
      deletedAt: null,
    });

    await expect(
      authService.login({ username: 'kepala.humas', password: 'admin123' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('rejects passing the stored bcrypt hash string directly as password', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 2,
      username: 'komang.ari',
      password: realPasswordHash,
      fullName: 'Komang Ari',
      role: Role.ADMIN,
      roleLabel: 'Admin',
      avatar: null,
      status: 'AKTIF',
      deletedAt: null,
    });

    await expect(
      authService.login({ username: 'komang.ari', password: realPasswordHash }),
    ).rejects.toThrow(UnauthorizedException);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('rejects inactive and suspended users even with valid password', async () => {
    for (const status of ['NONAKTIF', 'SUSPENDED']) {
      prisma.user.findFirst.mockResolvedValue({
        id: 3,
        username: 'nonaktif.user',
        password: realPasswordHash,
        fullName: 'User Nonaktif',
        role: Role.USER,
        roleLabel: 'Staff',
        avatar: null,
        status,
        deletedAt: null,
      });

      await expect(
        authService.login({ username: 'nonaktif.user', password: 'P@ssw0rdAman!' }),
      ).rejects.toThrow(UnauthorizedException);
    }
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('rejects unknown username cleanly (constant-time dummy bcrypt check)', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(
      authService.login({ username: 'tidak.ada', password: 'Password123!' }),
    ).rejects.toThrow(UnauthorizedException);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('issues JWT and strips password field when bcrypt hash matches', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 4,
      username: 'budi.fotografer',
      password: realPasswordHash,
      fullName: 'Budi Fotografer',
      role: Role.USER,
      roleLabel: 'Fotografer',
      avatar: null,
      status: 'AKTIF',
      deletedAt: null,
    });

    const result = await authService.login({
      username: 'budi.fotografer',
      password: 'P@ssw0rdAman!',
    });

    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 4,
      username: 'budi.fotografer',
      role: Role.USER,
    });
    expect(result.accessToken).toBe('signed.jwt.token');
    expect(result.token).toBe('signed.jwt.token');
    expect(result.user).not.toHaveProperty('password');
    expect(result.user).toMatchObject({
      id: 4,
      username: 'budi.fotografer',
      fullName: 'Budi Fotografer',
      role: Role.USER,
      roleLabel: 'Fotografer',
      avatar: null,
    });
  });
});
