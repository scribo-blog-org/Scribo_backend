import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailCodesService } from './email-codes.service';
import { PasswordResetService } from './password-reset.service';
import { RegisterService } from './register.service';
import { SessionService } from './session.service';
import { TokenService } from './token.service';
import { DatabaseModule } from '../../database/database.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [DatabaseModule, UsersModule],
    controllers: [AuthController],
    providers: [
        AuthService,
        SessionService,
        TokenService,
        EmailCodesService,
        RegisterService,
        PasswordResetService,
    ],
})
export class AuthModule {}
