import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AuthzModule } from './authz/authz.module';
import { ApiEnvelopeInterceptor } from './common/api-envelope.interceptor';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProfileModule } from './modules/profile/profile.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { PostsModule } from './modules/posts/posts.module';
import { InfraModule } from './common/infra.module';
import { SupportModule } from './modules/support/support.module';
import { LogsModule } from './modules/logs/logs.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.registerAsync({
            global: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.getOrThrow<string>('JWTKEY'),
            }),
        }),
        DatabaseModule,
        InfraModule,
        AuthzModule,
        AuthModule,
        UsersModule,
        ProfileModule,
        CategoriesModule,
        PostsModule,
        SupportModule,
        LogsModule,
        AnalyticsModule,
    ],
    controllers: [AppController],
    providers: [{ provide: APP_INTERCEPTOR, useClass: ApiEnvelopeInterceptor }],
})
export class AppModule {}
