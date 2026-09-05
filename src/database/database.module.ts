import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Session, SessionSchema } from './schemas/session.schema';
import { User, UserSchema } from './schemas/user.schema';
import {
    EmailVerificationCode,
    EmailVerificationCodeSchema,
} from './schemas/email-verification.schema';
import { Category, CategorySchema } from './schemas/category.schema';
import { Post, PostSchema } from './schemas/post.schema';
import { PostComment, PostCommentSchema } from './schemas/post-comment.schema';
import {
    SupportRequest,
    SupportRequestSchema,
} from './schemas/support-request.schema';
import { AppLog, AppLogSchema } from './schemas/log.schema';
import { PageView, PageViewSchema } from './schemas/page-view.schema';

@Module({
    imports: [
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const uri = config.get<string>('MONGODB_URI');
                if (uri) {
                    return { uri };
                }

                const user = config.get<string>('DB_USER');
                const password = config.get<string>('DB_PASSWORD');
                if (!user || !password) {
                    throw new Error(
                        'Set MONGODB_URI or DB_USER and DB_PASSWORD',
                    );
                }

                return {
                    uri: `mongodb+srv://${user}:${password}@cluster0.lccalb5.mongodb.net/?retryWrites=true&w=majority`,
                };
            },
        }),
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Session.name, schema: SessionSchema },
            {
                name: EmailVerificationCode.name,
                schema: EmailVerificationCodeSchema,
            },
            { name: Category.name, schema: CategorySchema },
            { name: Post.name, schema: PostSchema },
            { name: PostComment.name, schema: PostCommentSchema },
            { name: SupportRequest.name, schema: SupportRequestSchema },
            { name: AppLog.name, schema: AppLogSchema },
            { name: PageView.name, schema: PageViewSchema },
        ]),
    ],
    exports: [MongooseModule],
})
export class DatabaseModule {}
