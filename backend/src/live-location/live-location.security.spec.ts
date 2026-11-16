import { WsException } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { Socket } from 'socket.io';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { LiveLocationGateway } from './live-location.gateway';
import { LiveLocationService } from './live-location.service';
import { LocationsController } from './locations.controller';
import { TeamLocationsController } from './team-locations.controller';

function createMockSocket(token?: string): Socket {
  return {
    id: 'socket-1',
    handshake: {
      auth: token ? { token } : {},
      headers: {},
      query: {},
    },
    data: {},
    join: jest.fn().mockResolvedValue(undefined),
    emit: jest.fn(),
    disconnect: jest.fn(),
  } as unknown as Socket;
}

describe('LiveLocation Security (Opsi B Gateway & Opsi A Privacy)', () => {
  describe('LiveLocationGateway (Opsi B)', () => {
    let gateway: LiveLocationGateway;
    let liveLocationServiceMock: { updateLocation: jest.Mock };
    let jwtServiceMock: { verifyAsync: jest.Mock };
    let prismaMock: { user: { findUnique: jest.Mock } };
    let adminRoomEmitMock: jest.Mock;
    let serverToMock: jest.Mock;
    let globalEmitMock: jest.Mock;

    beforeEach(() => {
      liveLocationServiceMock = {
        updateLocation: jest.fn().mockResolvedValue({ userId: 7, latitude: -5.35, longitude: 105.23 }),
      };
      jwtServiceMock = {
        verifyAsync: jest.fn(),
      };
      prismaMock = {
        user: { findUnique: jest.fn() },
      };

      gateway = new LiveLocationGateway(
        liveLocationServiceMock as unknown as LiveLocationService,
        jwtServiceMock as unknown as JwtService,
        prismaMock as unknown as PrismaService,
      );

      adminRoomEmitMock = jest.fn();
      serverToMock = jest.fn().mockReturnValue({ emit: adminRoomEmitMock });
      globalEmitMock = jest.fn();
      gateway.server = {
        to: serverToMock,
        emit: globalEmitMock,
      } as any;
    });

    it('disconnects unauthenticated socket on handleConnection', async () => {
      const client = createMockSocket();

      await gateway.handleConnection(client);

      expect(client.emit).toHaveBeenCalledWith('exception', {
        status: 'error',
        message: 'Unauthorized',
      });
      expect(client.disconnect).toHaveBeenCalledWith(true);
    });

    it('joins user room only for USER and admins room for ADMIN', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValueOnce({ sub: 7, username: 'budi' });
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 7,
        username: 'budi',
        role: Role.USER,
        status: 'AKTIF',
        deletedAt: null,
      });

      const userSocket = createMockSocket('valid-user-jwt');
      await gateway.handleConnection(userSocket);

      expect(userSocket.join).toHaveBeenCalledWith('user:7');
      expect(userSocket.join).not.toHaveBeenCalledWith('admins');

      jwtServiceMock.verifyAsync.mockResolvedValueOnce({ sub: 1, username: 'admin' });
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 1,
        username: 'admin',
        role: Role.ADMIN,
        status: 'AKTIF',
        deletedAt: null,
      });

      const adminSocket = createMockSocket('valid-admin-jwt');
      await gateway.handleConnection(adminSocket);

      expect(adminSocket.join).toHaveBeenCalledWith('user:1');
      expect(adminSocket.join).toHaveBeenCalledWith('admins');
    });

    it('rejects updateLocation without valid JWT with WsException', async () => {
      const client = createMockSocket('invalid-jwt');
      jwtServiceMock.verifyAsync.mockRejectedValue(new Error('invalid signature'));

      await expect(
        gateway.handleUpdateLocation(client, {
          userId: 99,
          dto: { latitude: -5.35, longitude: 105.23, address: 'Kampus' },
        }),
      ).rejects.toThrow(WsException);

      expect(client.disconnect).toHaveBeenCalledWith(true);
      expect(liveLocationServiceMock.updateLocation).not.toHaveBeenCalled();
    });

    it('ignores spoofed payload.userId, uses authenticated user.id, and broadcasts only to admins room', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({ sub: 7, username: 'budi' });
      prismaMock.user.findUnique.mockResolvedValue({
        id: 7,
        username: 'budi',
        role: Role.USER,
        status: 'AKTIF',
        deletedAt: null,
      });

      const client = createMockSocket('Bearer valid-user-jwt');

      const result = await gateway.handleUpdateLocation(client, {
        userId: 999,
        dto: {
          latitude: -5.3582,
          longitude: 105.2335,
          address: 'Gedung Direktorat',
          isOnline: true,
        },
      });

      expect(liveLocationServiceMock.updateLocation).toHaveBeenCalledWith(7, {
        latitude: -5.3582,
        longitude: 105.2335,
        address: 'Gedung Direktorat',
        isOnline: true,
      });
      expect(serverToMock).toHaveBeenCalledWith('admins');
      expect(adminRoomEmitMock).toHaveBeenCalledWith('locationUpdated', {
        userId: 7,
        latitude: -5.35,
        longitude: 105.23,
      });
      expect(globalEmitMock).not.toHaveBeenCalled();
      expect(result).toEqual({
        status: 'success',
        data: { userId: 7, latitude: -5.35, longitude: 105.23 },
      });
    });

    it('rejects invalid GPS coordinates cleanly', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({ sub: 7, username: 'budi' });
      prismaMock.user.findUnique.mockResolvedValue({
        id: 7,
        username: 'budi',
        role: Role.USER,
        status: 'AKTIF',
        deletedAt: null,
      });

      const client = createMockSocket('valid-user-jwt');

      await expect(
        gateway.handleUpdateLocation(client, {
          dto: { latitude: 150, longitude: 105.23, address: 'Invalid' },
        }),
      ).rejects.toThrow(WsException);
      expect(liveLocationServiceMock.updateLocation).not.toHaveBeenCalled();
    });
  });

  describe('LiveLocation Privacy (Opsi A)', () => {
    it('passes req.user from TeamLocationsController and protects LocationsController with ADMIN roles', async () => {
      const serviceMock = {
        findAll: jest.fn().mockResolvedValue({ items: [] }),
      } as unknown as LiveLocationService;

      const teamController = new TeamLocationsController(serviceMock);
      await teamController.findAll({ user: { id: 7, role: Role.USER } }, '1');

      expect(serviceMock.findAll).toHaveBeenCalledWith({ id: 7, role: Role.USER }, true);

      const reflector = new Reflector();
      const locationRoles = reflector.getAllAndOverride<Role[]>(ROLES_KEY, [LocationsController]);
      expect(locationRoles).toEqual([Role.ADMIN, Role.SUPER_ADMIN]);
    });

    it('exposes only self and currently online peers to Role.USER while showing all to Role.ADMIN', async () => {
      const now = new Date();
      const twentyMinutesAgo = new Date(now.getTime() - 20 * 60 * 1000);

      const locationsRows = [
        {
          id: 1,
          userId: 7,
          latitude: -5.35,
          longitude: 105.23,
          address: 'Lokasi Sendiri (Offline)',
          distance: '0.1 km',
          isOnline: false,
          updatedAt: twentyMinutesAgo,
          user: { id: 7, fullName: 'Budi', phone: null, roleLabel: 'Fotografer', avatar: null },
        },
        {
          id: 2,
          userId: 8,
          latitude: -5.36,
          longitude: 105.24,
          address: 'Rekan Aktif',
          distance: '0.5 km',
          isOnline: true,
          updatedAt: now,
          user: { id: 8, fullName: 'Rina', phone: null, roleLabel: 'Reporter', avatar: null },
        },
        {
          id: 3,
          userId: 9,
          latitude: -5.39,
          longitude: 105.29,
          address: 'Rumah Pribadi Rekan Offline',
          distance: '3.2 km',
          isOnline: false,
          updatedAt: now,
          user: { id: 9, fullName: 'Andi', phone: null, roleLabel: 'Editor', avatar: null },
        },
        {
          id: 4,
          userId: 10,
          latitude: -5.41,
          longitude: 105.31,
          address: 'Lokasi Lama > 15 Menit',
          distance: '5.0 km',
          isOnline: true,
          updatedAt: twentyMinutesAgo,
          user: { id: 10, fullName: 'Siti', phone: null, roleLabel: 'Desainer', avatar: null },
        },
      ];

      const prismaMock = {
        location: {
          findMany: jest.fn().mockResolvedValue(locationsRows),
        },
        activity: {
          findMany: jest.fn().mockResolvedValue([]),
        },
      };

      const service = new LiveLocationService(
        prismaMock as unknown as PrismaService,
        { emit: jest.fn(), emitMultiple: jest.fn() } as any,
      );

      const userView = (await service.findAll({ id: 7, role: Role.USER }, false)) as any[];
      expect(userView.map((item) => item.userId)).toEqual([7, 8]);

      const adminView = (await service.findAll({ id: 1, role: Role.ADMIN }, false)) as any[];
      expect(adminView.map((item) => item.userId)).toEqual([7, 8, 9, 10]);
    });
  });
});
