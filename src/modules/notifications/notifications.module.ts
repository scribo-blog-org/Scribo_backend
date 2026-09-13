import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { NotificationsService } from './notifications.service';

import { SocketModule } from '../../socket/socket.module';

@Module({
    imports: [DatabaseModule, SocketModule],

    providers: [NotificationsService],

    exports: [NotificationsService],
})
export class NotificationsModule {}
