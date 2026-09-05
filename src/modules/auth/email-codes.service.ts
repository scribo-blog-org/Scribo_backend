import { timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmailVerificationCode } from '../../database/schemas/email-verification.schema';

export const RESET_PURPOSE = 'password_reset';

function emailFilter(email: string, purpose?: string) {
    if (purpose) {
        return { email, purpose };
    }
    return {
        email,
        $or: [{ purpose: { $exists: false } }, { purpose: 'register' }],
    };
}

@Injectable()
export class EmailCodesService {
    constructor(
        @InjectModel(EmailVerificationCode.name)
        private readonly codes: Model<EmailVerificationCode>,
    ) {}

    get(email: string, purpose?: string) {
        return this.codes.findOne(emailFilter(email, purpose)).lean();
    }

    async createRegisterCode(email: string, code: string) {
        const created = await this.codes.create({
            email,
            purpose: 'register',
            code,
            attempts: 0,
            createdAt: new Date(),
        });
        return created.toObject();
    }

    upsertPasswordResetCode(email: string, code: string) {
        return this.codes
            .findOneAndUpdate(
                { email, purpose: RESET_PURPOSE },
                {
                    $set: {
                        email,
                        purpose: RESET_PURPOSE,
                        code,
                        attempts: 0,
                        createdAt: new Date(),
                    },
                },
                { upsert: true, new: true },
            )
            .lean();
    }

    incrementAttempts(email: string, purpose?: string) {
        return this.codes
            .findOneAndUpdate(
                emailFilter(email, purpose),
                { $inc: { attempts: 1 } },
                { new: true },
            )
            .lean();
    }

    delete(email: string, purpose?: string) {
        return this.codes.findOneAndDelete(emailFilter(email, purpose)).lean();
    }

    codesMatch(left: string, right: string) {
        const a = Buffer.from(String(left || ''));
        const b = Buffer.from(String(right || ''));
        if (a.length !== b.length) return false;
        return timingSafeEqual(a, b);
    }
}
