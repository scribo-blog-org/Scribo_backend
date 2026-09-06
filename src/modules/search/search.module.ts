import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { UsersModule } from '../users/users.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
    imports: [DatabaseModule, UsersModule],
    controllers: [SearchController],
    providers: [SearchService],
})
export class SearchModule {}
