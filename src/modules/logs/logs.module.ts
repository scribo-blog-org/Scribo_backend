import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { LogsController } from './logs.controller';
import { LogsQueryService } from './logs.service';

@Module({
    imports: [DatabaseModule],
    controllers: [LogsController],
    providers: [LogsQueryService],
})
export class LogsModule {}
