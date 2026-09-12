import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { SocketModule } from '../../socket/socket.module';

@Module({
    imports: [DatabaseModule, SocketModule],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [UsersService],
})
export class UsersModule {}
