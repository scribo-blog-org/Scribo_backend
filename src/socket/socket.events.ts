import { Injectable } from '@nestjs/common';
import { SocketClient } from './socket.client';

@Injectable()
export class SocketEvents {
    constructor(private readonly socketClient: SocketClient) {}

    private async broadcast(
        room: string,
        event: string,
        payload: unknown,
    ): Promise<void> {
        const channel = this.socketClient.client.channel(room, {
            config: {
                private: true,
            },
        });

        const result = await channel.httpSend(event, payload);

        if (!result.success) {
            throw new Error(
                `Broadcast failed: ${result.status} ${result.error}`,
            );
        }
    }

    async userNotification(
        userId: string,
        notifications: unknown[],
    ): Promise<void> {
        await this.broadcast(`user:${userId}`, 'notification', {
            notifications,
        });
    }
}
