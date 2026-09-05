import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { LoggerService } from './logger.service';
import { MailService } from './mail.service';
import { StorageService } from './storage.service';

@Global()
@Module({
    imports: [DatabaseModule],
    providers: [MailService, StorageService, LoggerService],
    exports: [MailService, StorageService, LoggerService],
})
export class InfraModule {}
