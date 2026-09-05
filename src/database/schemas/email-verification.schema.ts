import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EmailVerificationDocument = HydratedDocument<EmailVerificationCode>;

@Schema({ collection: 'email_verification_codes' })
export class EmailVerificationCode {
    @Prop({ required: true, index: true })
    email!: string;

    @Prop({ default: 'register', index: true })
    purpose!: string;

    @Prop({ required: true })
    code!: string;

    @Prop({ default: 0 })
    attempts!: number;

    @Prop({ default: Date.now, expires: 600 })
    createdAt!: Date;
}

export const EmailVerificationCodeSchema = SchemaFactory.createForClass(
    EmailVerificationCode,
);
