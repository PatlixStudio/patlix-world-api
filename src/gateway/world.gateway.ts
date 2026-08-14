import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConnectedSocket, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { EventEnvelope } from '@patlixworld/shared';

/**
 * `/world` socket namespace: broadcasts domain events to every connected
 * client. Clients authenticate with a JWT on the handshake and receive a live
 * `event` stream (full state arrives via REST `GET /api/world/snapshot`).
 */
@WebSocketGateway({
  cors: { origin: '*', methods: ['GET', 'POST'] },
  namespace: '/world',
})
export class WorldGateway {
  private readonly logger = new Logger(WorldGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  afterInit(server: Server): void {
    server.use((socket, next) => {
      const auth = socket.handshake.auth as { token?: string } | undefined;
      const query = socket.handshake.query as { token?: string } | undefined;
      const token = auth?.token ?? query?.token;
      if (!token) {
        return next(new UnauthorizedException('Missing auth token'));
      }
      this.jwtService
        .verifyAsync<{ sub: string }>(token)
        .then((payload) => {
          (socket.data as { userId: string }).userId = payload.sub;
          next();
        })
        .catch(() => next(new UnauthorizedException('Invalid or expired token')));
    });
  }

  handleConnection(@ConnectedSocket() socket: Socket): void {
    this.logger.log(
      `Client connected to /world: ${socket.id} (user ${(socket.data as { userId?: string }).userId ?? '?'})`,
    );
  }

  handleDisconnect(@ConnectedSocket() socket: Socket): void {
    this.logger.log(`Client disconnected from /world: ${socket.id}`);
  }

  /** Broadcast an envelope to every connected client. */
  broadcast(envelope: EventEnvelope): void {
    this.server?.emit('event', envelope);
  }
}
