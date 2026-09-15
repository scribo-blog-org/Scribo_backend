import { Injectable } from '@nestjs/common';
import { SocketClient } from './socket.client';

@Injectable()
export class SocketEvents {
    constructor(private readonly socketClient: SocketClient) {}

    chatRoom(conversationId: string) {
        return `chat:${conversationId}`;
    }

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

    async chatMessage(conversationId: string, message: unknown): Promise<void> {
        await this.broadcast(this.chatRoom(conversationId), 'chat:message', {
            message,
        });
    }

    async chatRead(conversationId: string, payload: unknown): Promise<void> {
        await this.broadcast(
            this.chatRoom(conversationId),
            'chat:read',
            payload,
        );
    }

    async chatUnread(userId: string, unread: number): Promise<void> {
        await this.broadcast(`user:${userId}`, 'chat:unread', { unread });
    }

    async chatConversation(
        userId: string,
        conversation: unknown,
    ): Promise<void> {
        await this.broadcast(`user:${userId}`, 'chat:conversation', {
            conversation,
        });
    }

    async chatConversationDeleted(
        userId: string,
        conversationId: string,
    ): Promise<void> {
        await this.broadcast(`user:${userId}`, 'chat:conversation-deleted', {
            conversation_id: conversationId,
        });
    }
}
