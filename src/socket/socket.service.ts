import { Injectable, Logger } from '@nestjs/common';
import { SocketEvents } from './socket.events';

@Injectable()
export class SocketService {
    private readonly logger = new Logger(SocketService.name);

    constructor(private readonly socketEvents: SocketEvents) {}

    userNotification(userId: string, notifications: unknown[]): void {
        void this.socketEvents
            .userNotification(userId, notifications)
            .catch((error: unknown) => {
                this.logger.error(
                    `Failed to send notification to user ${userId}`,
                    error instanceof Error ? error.stack : error,
                );
            });
    }
}
