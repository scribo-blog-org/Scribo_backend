import {
    ConflictException,
    ForbiddenException,
    Injectable,
    InternalServerErrorException,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PERMISSIONS } from '../../authz/permissions';
import { hasPermission, isResourceOwner, type Actor } from '../../authz/policy';
import { StorageService } from '../../common/storage.service';
import { LoggerService } from '../../common/logger.service';
import { parsePagination } from '../../common/pagination';
import type { ListPostsQueryDto } from '../../common/query.dto';
import { fieldError } from '../../common/http-errors';
import { Category } from '../../database/schemas/category.schema';
import { Post } from '../../database/schemas/post.schema';
import { PostComment } from '../../database/schemas/post-comment.schema';
import { UsersService } from '../users/users.service';
import { CommentsService } from './comments.service';

@Injectable()
export class PostsService {
    constructor(
        @InjectModel(Post.name) private readonly posts: Model<Post>,
        @InjectModel(PostComment.name)
        private readonly comments: Model<PostComment>,
        @InjectModel(Category.name)
        private readonly categories: Model<Category>,
        private readonly commentsService: CommentsService,
        private readonly usersService: UsersService,
        private readonly storage: StorageService,
        private readonly logger: LoggerService,
    ) {}

    private objectId(value?: string) {
        if (!value) return undefined;
        const ids = String(value)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        if (!ids.length) return undefined;
        if (ids.length === 1) return new Types.ObjectId(ids[0]);
        return { $in: ids.map((id) => new Types.ObjectId(id)) };
    }

    private assertOwnerOrPermission(
        resourceAuthorId: unknown,
        actor: Actor,
        permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS],
        message: string,
    ) {
        if (
            isResourceOwner(resourceAuthorId, actor.id) ||
            hasPermission(actor, permission)
        ) {
            return;
        }
        throw new ForbiddenException(message);
    }

    async list(query: ListPostsQueryDto): Promise<{
        items: Record<string, unknown>[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }> {
        const { page, limit, skip } = parsePagination(query, 5, 50);
        const filter: Record<string, unknown> = {};
        const author = this.objectId(query.author);
        const category = this.objectId(query.category);
        if (author) filter.author = author;
        if (category) filter.category = category;
        if (query._id || query.ids || query.id) {
            const idsValue = query._id || query.ids || query.id;
            if (!String(idsValue || '').trim()) {
                return {
                    items: [],
                    pagination: { page, limit, total: 0, pages: 0 },
                };
            }
            filter._id = this.objectId(idsValue);
        }

        const total = await this.posts.countDocuments(filter);
        const items = await this.posts
            .find(filter)
            .sort({ created_date: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
        const expand = String(query.expand || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);
        const commentsByPost = await this.commentsService.forPosts(
            items.map((post) => post._id),
        );

        let authorMap = new Map<string, unknown>();
        if (expand.includes('author')) {
            const authors = await this.usersService.getPublicByIds(
                items.map((post) => post.author),
            );
            authorMap = new Map(
                authors.map((item) => [String(item._id), item]),
            );
        }

        let categoryMap = new Map<string, unknown>();
        if (expand.includes('category')) {
            const cats = await this.categories
                .find({
                    _id: { $in: items.map((post) => post.category) },
                })
                .lean();
            categoryMap = new Map(cats.map((cat) => [String(cat._id), cat]));
        }

        return {
            items: items.map((post) => ({
                ...post,
                comments: commentsByPost.get(String(post._id)) || [],
                author: expand.includes('author')
                    ? authorMap.get(String(post.author)) || null
                    : post.author,
                category: expand.includes('category')
                    ? categoryMap.get(String(post.category)) || null
                    : post.category,
            })) as Record<string, unknown>[],
            pagination: {
                page,
                limit,
                total,
                pages: total > 0 ? Math.ceil(total / limit) : 0,
            },
        };
    }

    async getById(id: string, expand?: string) {
        const post = await this.posts.findById(id).lean();
        if (!post) {
            throw new NotFoundException('Post not found!');
        }
        const flags = String(expand || '')
            .split(',')
            .map((item) => item.trim());
        const comments = await this.commentsService.listForPost(
            id,
            flags.includes('comments') ? 'author' : undefined,
        );
        const result: Record<string, unknown> = { ...post, comments };
        if (flags.includes('author')) {
            const authors = await this.usersService.getPublicByIds([
                post.author,
            ]);
            result.author = authors[0] || null;
        }
        if (flags.includes('category')) {
            result.category = await this.categories
                .findById(post.category)
                .lean();
        }
        return result;
    }

    async create(
        data: { postTitle: string; postContent: string; categoryId: string },
        featuredImage: Express.Multer.File | undefined,
        actor: Actor,
    ) {
        if (!hasPermission(actor, PERMISSIONS.CREATE_POST)) {
            throw new ForbiddenException(
                "You don't have permission to create a post",
            );
        }
        const category = await this.categories.findById(data.categoryId).lean();
        if (!category) {
            throw fieldError(
                'categoryId',
                'Category not found!',
                data.categoryId,
            );
        }

        let imgUrl: string | null = null;
        if (featuredImage && featuredImage.size !== 0) {
            imgUrl = await this.storage.uploadImage(
                featuredImage,
                'featured_image',
                Date.now().toString(),
                'featuredImage',
            );
            if (!imgUrl) {
                throw new InternalServerErrorException(
                    'Error to upload image to storage!',
                );
            }
        }

        const created = await this.posts.create({
            author: actor.id,
            title: data.postTitle,
            content_text: data.postContent,
            category: data.categoryId,
            ...(imgUrl ? { featured_image: imgUrl } : {}),
        });
        await this.logger.log({
            type: 'create_post',
            message: `User ${actor.nick_name} created post`,
            data: { user: actor.id, post: created._id },
        });
        return created.toObject();
    }

    async edit(
        id: string,
        data: {
            postTitle?: string;
            postContent?: string;
            categoryId?: string;
            featuredImage?: unknown;
        },
        featuredImage: Express.Multer.File | undefined,
        actor: Actor,
    ) {
        const post = await this.posts.findById(id).lean();
        if (!post) {
            throw new NotFoundException('Post not found!');
        }
        this.assertOwnerOrPermission(
            post.author,
            actor,
            PERMISSIONS.EDIT_ANY_POST,
            "You don't have permission to update a post",
        );

        const update: Record<string, unknown> = {};
        if (data.postTitle !== undefined) update.title = data.postTitle;
        if (data.postContent !== undefined)
            update.content_text = data.postContent;
        if (data.categoryId) {
            const category = await this.categories
                .findById(data.categoryId)
                .lean();
            if (!category) {
                throw fieldError(
                    'categoryId',
                    'Category not found!',
                    data.categoryId,
                );
            }
            update.category = data.categoryId;
        }

        const shouldTouchImage =
            featuredImage !== undefined ||
            Object.prototype.hasOwnProperty.call(data, 'featuredImage');
        if (shouldTouchImage) {
            await this.storage.deleteFile(post.featured_image);
            if (featuredImage && featuredImage.size !== 0) {
                const uploaded = await this.storage.uploadImage(
                    featuredImage,
                    'featured_image',
                    Date.now().toString(),
                    'featuredImage',
                );
                if (!uploaded) {
                    throw new InternalServerErrorException(
                        'Error to upload image to storage!',
                    );
                }
                update.featured_image = uploaded;
            } else {
                update.featured_image = null;
            }
        }

        const result = await this.posts
            .findByIdAndUpdate(id, update, { new: true })
            .lean();
        if (!result) {
            throw new NotFoundException('Post not found!');
        }
        await this.logger.log({
            type: 'update_post',
            message: `User ${actor.nick_name} updated post ${post._id}`,
            data: { user: actor.id, post: result._id },
        });
        return result;
    }

    async remove(id: string, actor: Actor) {
        const post = await this.posts.findById(id).lean();
        if (!post) {
            throw new NotFoundException('Post not found!');
        }
        this.assertOwnerOrPermission(
            post.author,
            actor,
            PERMISSIONS.DELETE_ANY_POST,
            "You don't have permission to delete a post",
        );

        await this.usersService.removePostFromSavedForUsers(id);
        const comments = await this.comments.find({ post_id: id }).lean();
        const commentIds = comments.map((comment) => comment._id);
        if (commentIds.length) {
            await this.comments.deleteMany({ _id: { $in: commentIds } });
        }

        const result = await this.posts.findByIdAndDelete(id).lean();
        if (!result) {
            throw new InternalServerErrorException('Failed to delete post!');
        }
        await this.storage.deleteFile(result.featured_image);

        if (commentIds.length) {
            await this.usersService.removeNotifications({
                type: { $in: ['reply_comment', 'like_comment'] },
                comment: { $in: commentIds },
            });
        }
        await this.usersService.removeNotifications({
            type: { $in: ['like_post', 'comment_post'] },
            post: id,
        });
        await this.logger.log({
            type: 'delete_post',
            message: `User ${actor.nick_name} deleted post ${id}`,
            data: { post: result._id, user: actor.id },
        });
        return result;
    }

    async save(id: string, actor: Actor) {
        const post = await this.posts.findById(id).lean();
        if (!post) {
            throw new NotFoundException('Post not found!');
        }
        const user = await this.usersService.getById(actor.id, {
            withSavedPosts: true,
        });
        if (!user) {
            throw new NotFoundException('User not found!');
        }
        if ((user.saved_posts || []).some((item) => String(item) === id)) {
            throw new ConflictException('Post is already in saved posts!');
        }
        const result = await this.usersService.addSavedPost(actor.id, id);
        return { saved_posts: result?.saved_posts };
    }

    async unsave(id: string, actor: Actor) {
        const post = await this.posts.findById(id).lean();
        if (!post) {
            throw new NotFoundException('Post not found!');
        }
        const user = await this.usersService.getById(actor.id, {
            withSavedPosts: true,
        });
        if (!user) {
            throw new NotFoundException('User not found!');
        }
        if (!(user.saved_posts || []).some((item) => String(item) === id)) {
            throw new ConflictException('Post is not in saved posts!');
        }
        const result = await this.usersService.removeSavedPost(actor.id, id);
        return { saved_posts: result?.saved_posts };
    }

    async like(id: string, actor: Actor) {
        const post = await this.posts.findById(id).lean();
        if (!post) {
            throw new NotFoundException('Post not found!');
        }
        if ((post.likes || []).some((like) => String(like) === actor.id)) {
            throw new ConflictException('Post is already liked!');
        }
        const result = await this.posts
            .findByIdAndUpdate(
                id,
                { $addToSet: { likes: actor.id } },
                { new: true },
            )
            .lean();
        if (String(post.author) !== actor.id) {
            await this.usersService.addNotification(post.author, {
                type: 'like_post',
                user: actor.id,
                post: id,
            });
        }
        return { likes: result?.likes };
    }

    async unlike(id: string, actor: Actor) {
        const post = await this.posts.findById(id).lean();
        if (!post) {
            throw new NotFoundException('Post not found!');
        }
        if (!(post.likes || []).some((like) => String(like) === actor.id)) {
            throw new ConflictException('Post is not liked!');
        }
        const result = await this.posts
            .findByIdAndUpdate(
                id,
                { $pull: { likes: actor.id } },
                { new: true },
            )
            .lean();
        return { likes: result?.likes };
    }
}
