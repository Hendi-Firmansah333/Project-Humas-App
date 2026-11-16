import { MessageEvent } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { RealtimeEventsService } from './realtime-events.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RealtimeEventsService', () => {
  let service: RealtimeEventsService;

  beforeEach(() => {
    service = new RealtimeEventsService();
  });

  it('updates module version and emits event on SSE stream', () => {
    const received: any[] = [];
    const sub = service.getStream().subscribe((msg: MessageEvent) => {
      received.push(msg.data);
    });

    const before = service.getVersions();
    service.emit('activities', 'created', 42);
    const after = service.getVersions();

    expect(after.activities).toBeGreaterThanOrEqual(before.activities);
    expect(received[0]).toMatchObject({
      scope: 'connected',
      action: 'ready',
    });
    expect(received[1]).toMatchObject({
      scope: 'activities',
      action: 'created',
      entityId: 42,
    });

    sub.unsubscribe();
  });

  it('emits multiple scopes together on emitMultiple', () => {
    const received: any[] = [];
    const sub = service.getStream().subscribe((msg: MessageEvent) => {
      received.push(msg.data);
    });

    service.emitMultiple(['activities', 'notifications'], 'approved', 99);

    expect(received.map((e) => e.scope)).toEqual([
      'connected',
      'activities',
      'notifications',
    ]);

    sub.unsubscribe();
  });

  it('persists and reads synced versions from Prisma for serverless cold starts', async () => {
    const executeRawMock = jest.fn().mockResolvedValue(1);
    const findManyMock = jest.fn().mockResolvedValue([
      { scope: 'activities', versionTs: BigInt(1799000000000) },
      { scope: 'schedules', versionTs: BigInt(1799000005000) },
    ]);

    const mockPrisma = {
      $executeRaw: executeRawMock,
      realtimeVersion: {
        findMany: findManyMock,
      },
    } as unknown as PrismaService;

    const dbService = new RealtimeEventsService(mockPrisma);

    // Cold-start instance harus mulai dari 0, bukan Date.now() lokal
    expect(dbService.getVersions().contentPlans).toBe(0);

    dbService.emitMultiple(['activities', 'notifications'], 'updated', 7);
    await dbService.flushPendingWrites();

    expect(executeRawMock).toHaveBeenCalledTimes(1);

    const synced = await dbService.getSyncedVersions();
    expect(synced.activities).toBeGreaterThanOrEqual(1799000000000);
    expect(synced.schedules).toBe(1799000005000);
    expect(synced.contentPlans).toBe(0);
  });

  it('emits use_polling handshake and completes on serverless SSE stream', async () => {
    const findManyMock = jest.fn().mockResolvedValue([
      { scope: 'activities', versionTs: BigInt(1234567890) },
    ]);

    const mockPrisma = {
      $executeRaw: jest.fn(),
      realtimeVersion: { findMany: findManyMock },
    } as unknown as PrismaService;

    const dbService = new RealtimeEventsService(mockPrisma);
    const events = await lastValueFrom(
      dbService.getServerlessPollingHandshakeStream(8000).pipe(toArray()),
    );

    expect(events).toHaveLength(1);
    expect(events[0].data).toMatchObject({
      scope: 'connected',
      action: 'use_polling',
      pollIntervalMs: 8000,
      versions: {
        activities: 1234567890,
      },
    });
  });
});
