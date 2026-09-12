import { Module } from '@nestjs/common';
import { SocketClient } from './socket.client';
import { SocketEvents } from './socket.events';
import { SocketService } from './socket.service';

@Module({
    providers: [SocketClient, SocketEvents, SocketService],
    exports: [SocketService],
})
export class SocketModule {}
