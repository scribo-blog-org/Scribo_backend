import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SocketModule } from '../../socket/socket.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
    imports: [DatabaseModule, SocketModule],
    controllers: [ChatController],
    providers: [ChatService],
    exports: [ChatService],
})
export class ChatModule {}
