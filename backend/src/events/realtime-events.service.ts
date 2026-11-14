import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, Subject, interval, map, merge } from 'rxjs';

export type RealtimeScope =
  | 'activities'
  | 'contentPlans'
  | 'schedules'
  | 'notifications'
  | 'teamLocations';

export interface RealtimeUpdateEvent {
  scope: RealtimeScope | 'ping' | 'connected';
  action: string;
  entityId?: string | number;
  ts: number;
}

@Injectable()
export class RealtimeEventsService {
  private readonly subject = new Subject<RealtimeUpdateEvent>();
  private readonly versions: Record<RealtimeScope, number> = {
    activities: Date.now(),
    contentPlans: Date.now(),
    schedules: Date.now(),
    notifications: Date.now(),
    teamLocations: Date.now(),
  };

  emit(scope: RealtimeScope, action: string, entityId?: string | number) {
    const ts = Date.now();
    this.versions[scope] = ts;
    this.subject.next({ scope, action, entityId, ts });
  }

  emitMultiple(scopes: RealtimeScope[], action: string, entityId?: string | number) {
    const ts = Date.now();
    for (const scope of scopes) {
      this.versions[scope] = ts;
      this.subject.next({ scope, action, entityId, ts });
    }
  }

  getVersions() {
    return {
      ...this.versions,
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
}

