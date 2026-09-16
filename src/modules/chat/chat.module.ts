import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SocketModule } from '../../socket/socket.module';
import { UsersModule } from '../users/users.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
    imports: [DatabaseModule, SocketModule, UsersModule],
    controllers: [ChatController],
    providers: [ChatService],
    exports: [ChatService],
})
export class ChatModule {}
