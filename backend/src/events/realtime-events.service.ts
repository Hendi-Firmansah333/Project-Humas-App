import { Injectable, Logger, MessageEvent, Optional } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Observable, Subject, interval, map, merge } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

export type RealtimeScope =
  | 'activities'
  | 'contentPlans'
  | 'schedules'
  | 'notifications'
  | 'teamLocations';

export const REALTIME_SCOPES: readonly RealtimeScope[] = [
  'activities',
  'contentPlans',
  'schedules',
  'notifications',
  'teamLocations',
];

export interface RealtimeUpdateEvent {
  scope: RealtimeScope | 'ping' | 'connected';
  action: string;
  entityId?: string | number;
  ts: number;
}

@Injectable()
export class RealtimeEventsService {
  private readonly logger = new Logger(RealtimeEventsService.name);
  private readonly subject = new Subject<RealtimeUpdateEvent>();
  private readonly versions: Record<RealtimeScope, number>;
  private readonly pendingWrites = new Set<Promise<void>>();

  constructor(@Optional() private readonly prisma?: PrismaService) {
    // Saat terhubung ke DB persisten (termasuk serverless multi-instance),
    // mulai dari 0 agar instance cold-start tidak menimpa versi terbaru di Neon.
    const initialVersion = this.prisma ? 0 : Date.now();
    this.versions = {
      activities: initialVersion,
      contentPlans: initialVersion,
      schedules: initialVersion,
      notifications: initialVersion,
      teamLocations: initialVersion,
    };
  }

  emit(scope: RealtimeScope, action: string, entityId?: string | number) {
    const ts = Date.now();
    this.versions[scope] = ts;
    this.subject.next({ scope, action, entityId, ts });
    this.enqueuePersist([scope], ts);
  }

  emitMultiple(scopes: RealtimeScope[], action: string, entityId?: string | number) {
    const ts = Date.now();
    const uniqueScopes = Array.from(new Set(scopes));
    for (const scope of uniqueScopes) {
      this.versions[scope] = ts;
      this.subject.next({ scope, action, entityId, ts });
    }
    this.enqueuePersist(uniqueScopes, ts);
  }

  private enqueuePersist(scopes: RealtimeScope[], ts: number) {
    if (!this.prisma || typeof this.prisma.$executeRaw !== 'function' || scopes.length === 0) {
      return;
    }

    const prisma = this.prisma;
    const task = (async () => {
      try {
        const values = scopes.map(
          (scope) => Prisma.sql`(${scope}, ${BigInt(ts)}, NOW())`,
        );
        await prisma.$executeRaw`
          INSERT INTO "RealtimeVersion" ("scope", "versionTs", "updatedAt")
          VALUES ${Prisma.join(values)}
          ON CONFLICT ("scope")
          DO UPDATE SET
            "versionTs" = GREATEST("RealtimeVersion"."versionTs", EXCLUDED."versionTs"),
            "updatedAt" = NOW()
        `;
      } catch (error) {
        this.logger.warn(
          `Gagal menyimpan versi realtime ke DB: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    })();

    this.pendingWrites.add(task);
    void task.finally(() => {
      this.pendingWrites.delete(task);
    });
  }

  async flushPendingWrites(): Promise<void> {
    if (this.pendingWrites.size === 0) {
      return;
    }
    await Promise.allSettled([...this.pendingWrites]);
  }

  getVersions() {
    return {
      ...this.versions,
      serverTime: Date.now(),
    };
  }

  async getSyncedVersions() {
    await this.flushPendingWrites();
    const merged: Record<RealtimeScope, number> = { ...this.versions };

    if (this.prisma?.realtimeVersion?.findMany) {
      try {
        const rows = await this.prisma.realtimeVersion.findMany();
        for (const row of rows) {
          if (row.scope in merged) {
            const scope = row.scope as RealtimeScope;
            const dbTs = Number(row.versionTs);
            if (Number.isFinite(dbTs) && dbTs > merged[scope]) {
              merged[scope] = dbTs;
              this.versions[scope] = dbTs;
            }
          }
        }
      } catch (error) {
        this.logger.warn(
          `Gagal membaca versi realtime dari DB, fallback ke cache memori: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return {
      ...merged,
      serverTime: Date.now(),
    };
  }

  getStream(): Observable<MessageEvent> {
    const initial$ = new Observable<MessageEvent>((subscriber) => {
      subscriber.next({
        data: {
          scope: 'connected',
          action: 'ready',
          ts: Date.now(),
          versions: this.versions,
        },
      });
    });

    const events$ = this.subject.asObservable().pipe(
      map((event): MessageEvent => ({ data: event })),
    );

    const heartbeat$ = interval(25000).pipe(
      map(
        (): MessageEvent => ({
          data: {
            scope: 'ping',
            action: 'heartbeat',
            ts: Date.now(),
          },
        }),
      ),
    );

    return merge(initial$, events$, heartbeat$);
  }

  getServerlessPollingHandshakeStream(pollIntervalMs = 8000): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      void this.getSyncedVersions()
        .then((versions) => {
          subscriber.next({
            data: {
              scope: 'connected',
              action: 'use_polling',
              pollIntervalMs,
              ts: Date.now(),
              versions,
            },
          });
        })
        .catch(() => {
          subscriber.next({
            data: {
              scope: 'connected',
              action: 'use_polling',
              pollIntervalMs,
              ts: Date.now(),
              versions: this.getVersions(),
            },
          });
        })
        .finally(() => {
          subscriber.complete();
        });
    });
  }
}
