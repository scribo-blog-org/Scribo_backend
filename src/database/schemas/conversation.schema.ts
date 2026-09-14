import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ collection: 'conversations', timestamps: true })
export class Conversation {
    @Prop({ required: true, unique: true, index: true })
    participant_key!: string;

    @Prop({ type: [Types.ObjectId], ref: 'User', required: true })
    participants!: Types.ObjectId[];

    @Prop({ type: Types.ObjectId, ref: 'ChatMessage', default: null })
    last_message_id?: Types.ObjectId | null;

    @Prop({ default: '' })
    last_message_text!: string;

    @Prop({ type: Date, default: null })
    last_message_at?: Date | null;

    @Prop({ type: Object, default: {} })
    last_read_at!: Record<string, Date>;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ participants: 1, last_message_at: -1 });
