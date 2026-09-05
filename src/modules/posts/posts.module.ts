import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { UsersModule } from '../users/users.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
    imports: [DatabaseModule, UsersModule],
    controllers: [PostsController, CommentsController],
    providers: [PostsService, CommentsService],
})
export class PostsModule {}
