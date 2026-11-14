import { MessageEvent } from '@nestjs/common';
import { RealtimeEventsService } from './realtime-events.service';

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
});

