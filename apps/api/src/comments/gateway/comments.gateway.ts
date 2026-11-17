import { Logger } from '@nestjs/common';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

import { WS_COMMENT_CREATED, type CommentResponse } from '@comments/shared';

@WebSocketGateway({
  cors: {
    origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:3000',
    credentials: true,
  },
})
export class CommentsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(CommentsGateway.name);

  handleConnection() {
    this.logger.log('Client connected');
  }

  broadcastCommentCreated(comment: CommentResponse) {
    this.server.emit(WS_COMMENT_CREATED, comment);
  }
}
