import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PERMISSIONS } from '../../authz/permissions';
import { hasPermission, isResourceOwner, type Actor } from '../../authz/policy';
import { Post } from '../../database/schemas/post.schema';
import { PostComment } from '../../database/schemas/post-comment.schema';
import { UsersService } from '../users/users.service';

function postIdMatch(id: Types.ObjectId | string) {
    const objectId =
        id instanceof Types.ObjectId ? id : new Types.ObjectId(String(id));
    return { $in: [objectId, String(objectId)] };
}

export type CommentLean = {
    _id: Types.ObjectId;
    author: unknown;
    post_id: Types.ObjectId;
    parent_comment_id?: Types.ObjectId | null;
    likes?: unknown[];
    comment_text?: string;
    replies?: CommentLean[];
};

@Injectable()
export class CommentsService {
    constructor(
        @InjectModel(PostComment.name)
        private readonly comments: Model<PostComment>,
        @InjectModel(Post.name) private readonly posts: Model<Post>,
        private readonly users: UsersService,
    ) {}

    buildTree(comments: CommentLean[]) {
        const commentMap = new Map<string, CommentLean>();
        const roots: CommentLean[] = [];

        for (const comment of comments) {
            comment.replies = [];
            commentMap.set(String(comment._id), comment);
        }

        for (const comment of comments) {
            if (!comment.parent_comment_id) {
                roots.push(comment);
                continue;
            }
            const parent = commentMap.get(String(comment.parent_comment_id));
            if (parent) {
                parent.replies!.push(comment);
            } else {
                roots.push(comment);
            }
        }

        return roots;
    }

    treesByPost(comments: CommentLean[]) {
        const byPost = new Map<string, CommentLean[]>();
        for (const comment of comments) {
            const postId = String(comment.post_id);
            const list = byPost.get(postId) || [];
            list.push(comment);
            byPost.set(postId, list);
        }
        const result = new Map<string, CommentLean[]>();
        for (const [postId, postComments] of byPost) {
            result.set(postId, this.buildTree(postComments));
        }
        return result;
    }

    async attachAuthors(comments: CommentLean[]) {
        const authors = await this.users.getPublicByIds(
            comments.map((comment) => comment.author),
        );
        const authorMap = new Map(
            authors.map((author) => [String(author._id), author]),
        );
        for (const comment of comments) {
            comment.author = authorMap.get(String(comment.author)) || null;
        }
        return comments;
    }

    async countsByPost(postIds: Types.ObjectId[]) {
        if (!postIds.length) {
            return new Map<string, number>();
        }
        const rows = await this.comments.aggregate<{
            _id: Types.ObjectId;
            count: number;
        }>([
            {
                $match: {
                    post_id: {
                        $in: postIds.flatMap((id) => [id, String(id)]),
                    },
                },
            },
            { $group: { _id: '$post_id', count: { $sum: 1 } } },
        ]);
        const counts = new Map<string, number>();
        for (const row of rows) {
            const key = String(row._id);
            counts.set(key, (counts.get(key) || 0) + row.count);
        }
        return counts;
    }

    async forPosts(postIds: Types.ObjectId[]) {
        if (!postIds.length) {
            return new Map<string, CommentLean[]>();
        }
        const comments = await this.comments
            .find({
                post_id: {
                    $in: postIds.flatMap((id) => [id, String(id)]),
                },
            })
            .lean<CommentLean[]>();
        return this.treesByPost(comments);
    }

    async listForPost(postId: string, expand?: string): Promise<CommentLean[]> {
        const post = await this.posts.findById(postId).lean();
        if (!post) {
            throw new NotFoundException('Post not found!');
        }
        const comments = await this.comments
            .find({ post_id: postIdMatch(post._id) })
            .lean<CommentLean[]>();
        if (
            expand === 'author' ||
            String(expand || '')
                .split(',')
                .includes('author')
        ) {
            await this.attachAuthors(comments);
        }
        return this.buildTree(comments);
    }

    async create(
        postId: string,
        commentText: string,
        parentCommentId: string | undefined,
        actor: Actor,
    ) {
        const post = await this.posts.findById(postId).lean();
        if (!post) {
            throw new NotFoundException('Post not found!');
        }

        if (parentCommentId) {
            const parent = await this.comments
                .findById(parentCommentId)
                .lean<CommentLean>();
            if (!parent) {
                throw new NotFoundException('Parent comment not found!');
            }
            if (String(parent.post_id) !== String(postId)) {
                throw new ConflictException(
                    'Parent comment does not belong to this post!',
                );
            }
            const result = await this.comments.create({
                post_id: post._id,
                comment_text: commentText,
                author: actor.id,
                parent_comment_id: parentCommentId,
            });
            if (String(parent.author) !== actor.id) {
                await this.users.addNotification(parent.author, {
                    type: 'reply_comment',
                    user: actor.id,
                    comment: result._id,
                    post: postId,
                });
            }
            return result.toObject();
        }

        const result = await this.comments.create({
            post_id: post._id,
            comment_text: commentText,
            author: actor.id,
        });
        if (String(post.author) !== actor.id) {
            await this.users.addNotification(post.author, {
                type: 'comment_post',
                user: actor.id,
                post: postId,
                comment: result._id,
            });
        }
        return result.toObject();
    }

    async remove(commentId: string, actor: Actor) {
        const root = await this.comments
            .findById(commentId)
            .lean<CommentLean>();
        if (!root) {
            throw new NotFoundException('Comment not found!');
        }
        if (
            !isResourceOwner(root.author, actor.id) &&
            !hasPermission(actor, PERMISSIONS.DELETE_ANY_COMMENT)
        ) {
            throw new ForbiddenException(
                "You don't have permission to delete this comment",
            );
        }

        const comments = await this.comments
            .find({ post_id: postIdMatch(root.post_id) })
            .lean<CommentLean[]>();
        const ids = this.idsToDelete(comments, root._id);
        const result = await this.comments.deleteMany({ _id: { $in: ids } });
        await this.users.removeNotifications({ comment: { $in: ids } });
        return result;
    }

    private idsToDelete(comments: CommentLean[], rootId: Types.ObjectId) {
        const childrenMap = new Map<string, Types.ObjectId[]>();
        for (const comment of comments) {
            if (!comment.parent_comment_id) continue;
            const parentId = String(comment.parent_comment_id);
            const children = childrenMap.get(parentId) || [];
            children.push(comment._id);
            childrenMap.set(parentId, children);
        }
        const result = [rootId];
        const queue = [String(rootId)];
        while (queue.length) {
            const parentId = queue.shift()!;
            for (const childId of childrenMap.get(parentId) || []) {
                result.push(childId);
                queue.push(String(childId));
            }
        }
        return result;
    }

    async edit(
        commentId: string,
        commentText: string | undefined,
        actor: Actor,
    ) {
        const comment = await this.comments
            .findById(commentId)
            .lean<CommentLean>();
        if (!comment) {
            throw new NotFoundException('Comment not found!');
        }
        if (!isResourceOwner(comment.author, actor.id)) {
            throw new ForbiddenException(
                "You don't have permission to edit this comment",
            );
        }
        return this.comments
            .findByIdAndUpdate(
                commentId,
                { comment_text: commentText },
                { returnDocument: 'after', runValidators: true },
            )
            .lean();
    }

    async like(commentId: string, actor: Actor) {
        const comment = await this.comments
            .findById(commentId)
            .lean<CommentLean>();
        if (!comment) {
            throw new NotFoundException('Comment not found!');
        }
        if ((comment.likes || []).some((id) => String(id) === actor.id)) {
            throw new ConflictException('You have already liked this comment!');
        }
        return this.comments
            .findByIdAndUpdate(
                commentId,
                { $addToSet: { likes: actor.id } },
                { returnDocument: 'after', runValidators: true },
            )
            .lean();
    }

    async unlike(commentId: string, actor: Actor) {
        const comment = await this.comments
            .findById(commentId)
            .lean<CommentLean>();
        if (!comment) {
            throw new NotFoundException('Comment not found!');
        }
        if (!(comment.likes || []).some((id) => String(id) === actor.id)) {
            throw new ConflictException('You have not liked this comment!');
        }
        return this.comments
            .findByIdAndUpdate(
                commentId,
                { $pull: { likes: actor.id } },
                { returnDocument: 'after', runValidators: true },
            )
            .lean();
    }
}
