import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LiveLocationService } from './live-location.service';
import { UpdateLocationDto } from './dto/update-location.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'live-location',
})
export class LiveLocationGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly liveLocationService: LiveLocationService) {}

  @SubscribeMessage('ping')
  handlePing(): string {
    return 'pong';
  }

  @SubscribeMessage('updateLocation')
  async handleUpdateLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId: number; dto: UpdateLocationDto },
  ) {
    if (!payload || !payload.userId) return;

    // Simpan ke database
    const updated = await this.liveLocationService.updateLocation(payload.userId, payload.dto);

    // Broadcast koordinat terbaru ke seluruh admin panel web & anggota lain yang terkoneksi
    this.server.emit('locationUpdated', updated);

    return { status: 'success', data: updated };
  }
}
