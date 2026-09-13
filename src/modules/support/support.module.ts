import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { UsersModule } from '../users/users.module';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [DatabaseModule, UsersModule, NotificationsModule],
    controllers: [SupportController],
    providers: [SupportService],
    exports: [SupportService],
})
export class SupportModule {}
