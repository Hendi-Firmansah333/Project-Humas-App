import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { RealtimeEventsService } from '../events/realtime-events.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('Users Self-Service Profile & Password', () => {
  let service: UsersService;
  let prisma: {
    user: { findUnique: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
    activity: { count: jest.Mock };
    contentPlan: { count: jest.Mock };
    equipmentLoan: { count: jest.Mock };
  };
  let eventsService: { emit: jest.Mock };
  let currentHash: string;

  beforeAll(async () => {
    currentHash = await bcrypt.hash('PasswordLama1!', 4);
  });

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      activity: { count: jest.fn().mockResolvedValue(5) },
      contentPlan: { count: jest.fn().mockResolvedValue(3) },
      equipmentLoan: { count: jest.fn().mockResolvedValue(2) },
    };
    eventsService = { emit: jest.fn() };
    service = new UsersService(
      prisma as unknown as PrismaService,
      eventsService as unknown as RealtimeEventsService,
    );
  });

  it('allows USER, ADMIN, and SUPER_ADMIN on /me routes while keeping :id admin-only', () => {
    const reflector = new Reflector();
    expect(reflector.getAllAndOverride<Role[]>(ROLES_KEY, [UsersController.prototype.getMe])).toEqual([
      Role.SUPER_ADMIN,
      Role.ADMIN,
      Role.USER,
    ]);
    expect(
      reflector.getAllAndOverride<Role[]>(ROLES_KEY, [UsersController.prototype.updateMe]),
    ).toEqual([Role.SUPER_ADMIN, Role.ADMIN, Role.USER]);
    expect(
      reflector.getAllAndOverride<Role[]>(ROLES_KEY, [UsersController.prototype.changeMyPassword]),
    ).toEqual([Role.SUPER_ADMIN, Role.ADMIN, Role.USER]);
    expect(reflector.getAllAndOverride<Role[]>(ROLES_KEY, [UsersController.prototype.update])).toEqual(
      [Role.ADMIN, Role.SUPER_ADMIN],
    );
  });

  it('returns user profile with real DB counts in getMyProfile', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 7,
      fullName: 'Budi Santoso',
      username: 'budi.s',
      email: 'budi@polinela.ac.id',
      phone: '08123456789',
      password: currentHash,
      role: Role.USER,
      roleLabel: 'Fotografer',
      avatar: null,
      status: 'AKTIF',
      deletedAt: null,
    });

    const profile = await service.getMyProfile(7);

    expect(profile).not.toHaveProperty('password');
    expect(profile.stats).toEqual({ activities: 5, contentPlans: 3, loans: 2 });
  });

  it('allows USER to update fullName, phone, and Cloudinary avatar while rejecting local file paths and email edits', async () => {
    const existing = {
      id: 7,
      fullName: 'Budi Santoso',
      username: 'budi.s',
      email: 'budi@polinela.ac.id',
      phone: '08123456789',
      password: currentHash,
      role: Role.USER,
      roleLabel: 'Fotografer',
      avatar: null,
      status: 'AKTIF',
      deletedAt: null,
    };
    prisma.user.findUnique.mockResolvedValue(existing);

    await expect(
      service.updateMyProfile(7, Role.USER, { email: 'baru@polinela.ac.id' }),
    ).rejects.toThrow(ForbiddenException);

    await expect(
      service.updateMyProfile(7, Role.USER, { avatar: '/data/user/0/avatar.jpg' }),
    ).rejects.toThrow(BadRequestException);

    prisma.user.update.mockResolvedValue({
      ...existing,
      fullName: 'Budi Updated',
      phone: '089988776655',
      avatar: 'https://res.cloudinary.com/dcpne6otf/image/upload/v1/avatar.jpg',
    });

    const updated = await service.updateMyProfile(7, Role.USER, {
      fullName: '  Budi Updated  ',
      phone: '089988776655',
      avatar: 'https://res.cloudinary.com/dcpne6otf/image/upload/v1/avatar.jpg',
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: {
        fullName: 'Budi Updated',
        phone: '089988776655',
        avatar: 'https://res.cloudinary.com/dcpne6otf/image/upload/v1/avatar.jpg',
      },
    });
    expect(updated).not.toHaveProperty('password');
    expect(eventsService.emit).toHaveBeenCalledWith('teamLocations', 'profile_updated', 7);
  });

  it('rejects duplicate username/email for ADMIN in updateMyProfile', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      fullName: 'Admin Humas',
      username: 'komang.ari',
      email: 'komang@polinela.ac.id',
      role: Role.ADMIN,
      deletedAt: null,
    });
    prisma.user.findFirst.mockResolvedValue({ id: 2, username: 'kepala.humas' });

    await expect(
      service.updateMyProfile(1, Role.ADMIN, { username: 'kepala.humas' }),
    ).rejects.toThrow(ConflictException);
  });

  it('verifies currentPassword via bcrypt and updates hashed password in changeMyPassword', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 7,
      password: currentHash,
      deletedAt: null,
    });

    await expect(
      service.changeMyPassword(7, {
        currentPassword: 'SalahPassword1!',
        password: 'PasswordBaru1!',
        confirmPassword: 'PasswordBaru1!',
      }),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.changeMyPassword(7, {
        currentPassword: 'PasswordLama1!',
        password: 'PasswordBaru1!',
        confirmPassword: 'TidakCocok1!',
      }),
    ).rejects.toThrow(BadRequestException);

    await service.changeMyPassword(7, {
      currentPassword: 'PasswordLama1!',
      password: 'PasswordBaru1!',
      confirmPassword: 'PasswordBaru1!',
    });

    const updateArgs = prisma.user.update.mock.calls[0][0];
    expect(updateArgs.where).toEqual({ id: 7 });
    expect(await bcrypt.compare('PasswordBaru1!', updateArgs.data.password)).toBe(true);
  });
});

