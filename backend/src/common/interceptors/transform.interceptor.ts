import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Optional,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { RealtimeEventsService } from '../../events/realtime-events.service';

export interface StandardResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, StandardResponse<T> | T>
{
  constructor(
    @Optional() private readonly eventsService?: RealtimeEventsService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T> | T> {
    const http = context.switchToHttp();
    const request = http.getRequest<{ url?: string }>();
    if (request?.url?.includes('/events/stream')) {
      return next.handle();
    }

    const statusCode = http.getResponse().statusCode;

    return next.handle().pipe(
      switchMap(async (data) => {
        await this.eventsService?.flushPendingWrites();
        return {
          success: true,
          statusCode,
          data: data !== undefined ? data : null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
