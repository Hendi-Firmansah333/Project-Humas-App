import { Controller, Get, Sse, UseGuards, MessageEvent } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Observable } from 'rxjs';
import { RealtimeEventsService } from './realtime-events.service';

@ApiTags('Events')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@SkipThrottle()
@Controller('api/events')
export class EventsController {
  constructor(private readonly eventsService: RealtimeEventsService) {}

  @Sse('stream')
  @ApiOperation({ summary: 'Stream SSE real-time pembaruan data untuk mobile & web' })
  stream(): Observable<MessageEvent> {
    return this.eventsService.getStream();
  }

  @Get('version')
  @ApiOperation({ summary: 'Cek versi timestamp perubahan terbaru per modul (ringan, in-memory)' })
  getVersions() {
    return this.eventsService.getVersions();
  }
}

