import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  WsException,
} from '@nestjs/websockets';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { LiveLocationService } from './live-location.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { PrismaService } from '../prisma/prisma.service';
import { getJwtSecret } from '../auth/jwt-secret.util';

const ADMIN_ROOM = 'admins';
const LOCAL_DEV_ORIGIN_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

interface AuthenticatedSocketUser {
  id: number;
  username: string;
  role: Role;
}

function getAllowedSocketOrigins(): string[] {
  const raw = process.env['CORS_ORIGIN'] || process.env['FRONTEND_URL'] || '';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isAllowedSocketOrigin(origin?: string): boolean {
  // Aplikasi mobile native / non-browser socket client tidak mengirim header Origin
  if (!origin) {
    return true;
  }

  const allowedOrigins = getAllowedSocketOrigins();
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  if (process.env['NODE_ENV'] !== 'production' && LOCAL_DEV_ORIGIN_REGEX.test(origin)) {
    return true;
  }

  return false;
}

@WebSocketGateway({
  cors: {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (isAllowedSocketOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin WebSocket tidak diizinkan oleh kebijakan CORS.'), false);
    },
    credentials: true,
  },
  namespace: 'live-location',
})
export class LiveLocationGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LiveLocationGateway.name);

  constructor(
    private readonly liveLocationService: LiveLocationService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake?.auth?.token;
    const headerAuth = client.handshake?.headers?.authorization;
    const queryToken = client.handshake?.query?.token;

    const rawToken =
      typeof authToken === 'string' && authToken.trim()
        ? authToken
        : typeof headerAuth === 'string' && headerAuth.trim()
          ? headerAuth
          : typeof queryToken === 'string' && queryToken.trim()
            ? queryToken
            : Array.isArray(queryToken) && typeof queryToken[0] === 'string'
              ? queryToken[0]
              : null;

    if (!rawToken) {
      return null;
    }

    const token = rawToken.startsWith('Bearer ') ? rawToken.slice(7).trim() : rawToken.trim();
    return token || null;
  }

  private authenticateClient(client: Socket): Promise<AuthenticatedSocketUser> {
    if (client.data?.user) {
      return Promise.resolve(client.data.user as AuthenticatedSocketUser);
    }

    if (!client.data) {
      client.data = {};
    }

    if (!client.data.authPromise) {
      client.data.authPromise = (async (): Promise<AuthenticatedSocketUser> => {
        const token = this.extractToken(client);
        if (!token) {
          throw new UnauthorizedException('Token autentikasi WebSocket tidak ditemukan.');
        }

        let payload: { sub?: number; username?: string };
        try {
          payload = await this.jwtService.verifyAsync(token, {
            secret: getJwtSecret(),
          });
        } catch {
          throw new UnauthorizedException('Token WebSocket tidak valid atau kedaluwarsa.');
        }

        if (!payload?.sub) {
          throw new UnauthorizedException('Payload token WebSocket tidak valid.');
        }

        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
          select: {
            id: true,
            username: true,
            role: true,
            status: true,
            deletedAt: true,
          },
        });

        if (!user || user.status !== 'AKTIF' || user.deletedAt !== null) {
          throw new UnauthorizedException('Akun pengguna tidak aktif atau tidak ditemukan.');
        }

        const authUser: AuthenticatedSocketUser = {
          id: user.id,
          username: user.username,
          role: user.role,
        };
        client.data.user = authUser;

        await client.join(`user:${user.id}`);
        if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
          await client.join(ADMIN_ROOM);
        }

        return authUser;
      })().catch((error) => {
        delete client.data.authPromise;
        throw error;
      });
    }

    return client.data.authPromise;
  }

  private async ensureAuthenticated(client: Socket): Promise<AuthenticatedSocketUser> {
    try {
      return await this.authenticateClient(client);
    } catch (error) {
      client.disconnect(true);
      throw new WsException(
        error instanceof Error ? error.message : 'Unauthorized WebSocket access.',
      );
    }
  }

  async handleConnection(client: Socket) {
    try {
      await this.authenticateClient(client);
    } catch (error) {
      this.logger.warn(
        `Menolak koneksi WebSocket live-location (${client.id}): ${
          error instanceof Error ? error.message : 'Unauthorized'
        }`,
      );
      client.emit('exception', { status: 'error', message: 'Unauthorized' });
      client.disconnect(true);
    }
  }

  @SubscribeMessage('ping')
  async handlePing(@ConnectedSocket() client: Socket): Promise<string> {
    await this.ensureAuthenticated(client);
    return 'pong';
  }

  @SubscribeMessage('updateLocation')
  async handleUpdateLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId?: number; dto?: UpdateLocationDto } | UpdateLocationDto,
  ) {
    const authUser = await this.ensureAuthenticated(client);

    const rawDto = (
      payload && typeof payload === 'object' && 'dto' in payload ? payload.dto : payload
    ) as Partial<UpdateLocationDto> | undefined;

    if (
      !rawDto ||
      typeof rawDto !== 'object' ||
      typeof rawDto.latitude !== 'number' ||
      !Number.isFinite(rawDto.latitude) ||
      rawDto.latitude < -90 ||
      rawDto.latitude > 90 ||
      typeof rawDto.longitude !== 'number' ||
      !Number.isFinite(rawDto.longitude) ||
      rawDto.longitude < -180 ||
      rawDto.longitude > 180
    ) {
      throw new WsException('Koordinat lokasi tidak valid.');
    }

    const dto: UpdateLocationDto = {
      latitude: rawDto.latitude,
      longitude: rawDto.longitude,
      address: typeof rawDto.address === 'string' ? rawDto.address : '',
      ...(typeof rawDto.distance === 'string' ? { distance: rawDto.distance } : {}),
      ...(typeof rawDto.isOnline === 'boolean' ? { isOnline: rawDto.isOnline } : {}),
    };

    try {
      // Simpan ke database menggunakan user.id hasil verifikasi JWT (hanya role USER yang diizinkan)
      const updated = await this.liveLocationService.updateLocation(authUser.id, dto);

      // Broadcast hanya ke ruang admin terautentikasi
      this.server.to(ADMIN_ROOM).emit('locationUpdated', updated);

      return { status: 'success', data: updated };
    } catch (err: any) {
      return { status: 'error', message: err?.message || 'Tidak diizinkan.' };
    }
  }
}
