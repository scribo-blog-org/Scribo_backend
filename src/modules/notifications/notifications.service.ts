import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { SocketService } from '../../socket/socket.service';
import { User } from '../../database/schemas/user.schema';

import type { CreateNotification } from './notifications.type';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectModel(User.name) private readonly users: Model<User>,
        private readonly socketService: SocketService,
    ) {}

    async sendNotification(userId: string, notification: CreateNotification) {
        const notificationUpdate = await this.users.findByIdAndUpdate(
            userId,
            {
                $push: {
                    notifications: {
                        is_read: false,
                        time: new Date(),
                        ...notification,
                    },
                },
            },
            { returnDocument: 'after', runValidators: true },
        );

        if (notificationUpdate) {
            this.socketService.userNotification(
                String(userId),
                notificationUpdate.notifications,
            );
        }
    }
}
