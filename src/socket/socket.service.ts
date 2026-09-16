import { Injectable, Logger } from '@nestjs/common';
import { SocketClient } from './socket.client';
import { SocketEvents } from './socket.events';

@Injectable()
export class SocketService {
    private readonly logger = new Logger(SocketService.name);

    constructor(
        private readonly socketEvents: SocketEvents,
        private readonly socketClient: SocketClient,
    ) {}

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

    chatMessage(
        conversationId: string,
        message: unknown,
        participantIds: string[],
    ): void {
        void this.socketEvents
            .chatMessage(conversationId, message)
            .catch((error: unknown) => {
                this.logger.error(
                    `Failed to send chat message to ${conversationId}`,
                    error instanceof Error ? error.stack : error,
                );
            });
    }

    chatRead(
        conversationId: string,
        payload: unknown,
        participantIds: string[],
    ): void {
        void this.socketEvents
            .chatRead(conversationId, payload)
            .catch((error: unknown) => {
                this.logger.error(
                    `Failed to send chat read to ${conversationId}`,
                    error instanceof Error ? error.stack : error,
                );
            });
    }

    chatUnread(userId: string, unread: number): void {
        void this.socketEvents
            .chatUnread(userId, unread)
            .catch((error: unknown) => {
                this.logger.error(
                    `Failed to send chat unread to user ${userId}`,
                    error instanceof Error ? error.stack : error,
                );
            });
    }

    chatConversation(userId: string, conversation: unknown): void {
        void this.socketEvents
            .chatConversation(userId, conversation)
            .catch((error: unknown) => {
                this.logger.error(
                    `Failed to send chat conversation to user ${userId}`,
                    error instanceof Error ? error.stack : error,
                );
            });
    }

    syncConversationMembers(conversationId: string, userIds: string[]): void {
        const rows = userIds.map((userId) => ({
            conversation_id: conversationId,
            user_id: userId,
        }));

        void this.socketClient.client
            .from('conversation_members')
            .upsert(rows, { onConflict: 'conversation_id,user_id' })
            .then(({ data, error }) => {
                if (error) {
                    this.logger.error(
                        `Failed to sync conversation members for ${conversationId}`,
                        error,
                    );
                    return;
                }

                this.logger.log(
                    `Synced conversation members for ${conversationId}: ${userIds.join(', ')}`,
                    data,
                );
            });
    }

    async removeConversationMembers(conversationId: string): Promise<void> {
        const { error } = await this.socketClient.client
            .from('conversation_members')
            .delete()
            .eq('conversation_id', conversationId);

        if (error) {
            this.logger.error(
                `Failed to remove conversation members for ${conversationId}`,
                error,
            );
            throw error;
        }

        this.logger.log(
            `Removed conversation members for ${conversationId}`,
        );
    }

    chatConversationDeleted(userId: string, conversationId: string): void {
        void this.socketEvents
            .chatConversationDeleted(userId, conversationId)
            .catch((error: unknown) => {
                this.logger.error(
                    `Failed to send chat deletion to user ${userId}`,
                    error instanceof Error ? error.stack : error,
                );
            });
    }

}
