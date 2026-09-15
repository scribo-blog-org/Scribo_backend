import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';

import { NotificationsService } from './notifications.service';
import { MentionNotificationsService } from './mention-notifications.service';

import { SocketModule } from '../../socket/socket.module';

@Module({
    imports: [DatabaseModule, SocketModule],

    providers: [NotificationsService, MentionNotificationsService],

    exports: [NotificationsService, MentionNotificationsService],
})
export class NotificationsModule {}
