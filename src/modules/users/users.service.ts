import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { canManageRole } from '../../authz/policy';
import type { Actor } from '../../authz/policy';
import type { Role } from '../../authz/roles';
import { LoggerService } from '../../common/logger.service';
import { Session } from '../../database/schemas/session.schema';
import { User } from '../../database/schemas/user.schema';

type UserLean = {
    _id: Types.ObjectId;
    nick_name: string;
    email: string;
    password?: string;
    role: Role;
    is_saved_posts_public?: boolean;
    saved_posts?: unknown[];
    follows: unknown[];
    followers: unknown[];
    notifications?: unknown[];
};

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private readonly users: Model<User>,
        @InjectModel(Session.name) private readonly sessions: Model<Session>,
        private readonly logger: LoggerService,
    ) {}

    sanitize(
        user: UserLean | null,
        options: {
            withPassword?: boolean;
            withSavedPosts?: boolean;
            withNotifications?: boolean;
        } = {},
    ) {
        if (!user) return null;
        const copy = { ...user } as UserLean;
        if (!options.withPassword) delete copy.password;
        if (options.withSavedPosts === false) {
            delete copy.saved_posts;
        } else if (
            options.withSavedPosts !== true &&
            copy.is_saved_posts_public === false
        ) {
            delete copy.saved_posts;
        }
        if (!options.withNotifications) delete copy.notifications;
        return copy;
    }

    async getById(
        id: string,
        options?: {
            withPassword?: boolean;
            withNotifications?: boolean;
            withSavedPosts?: boolean;
        },
    ) {
        const user = await this.users.findById(id).lean<UserLean>();
        return this.sanitize(user, options);
    }

    async getByQuery(
        query: Record<string, unknown>,
        options?: { withPassword?: boolean },
    ) {
        const user = await this.users.findOne(query).lean<UserLean>();
        return this.sanitize(user, options);
    }

    async getByNickName(nickName: string) {
        const user = await this.getByQuery({ nick_name: nickName });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    async getUsers(params: Record<string, string | undefined>) {
        const allowed = ['nick_name', 'email', 'role', 'is_verified', '_id'];
        const query = Object.fromEntries(
            Object.entries(params).filter(
                ([key, value]) => allowed.includes(key) && value !== undefined,
            ),
        );
        const users = await this.users.find(query).lean<UserLean[]>();
        return users.map((user) => this.sanitize(user)!);
    }

    async follow(userId: string, actor: Actor) {
        const followed = await this.users.findById(userId).lean<UserLean>();
        const follower = await this.users.findById(actor.id).lean<UserLean>();
        if (!followed || !follower) {
            throw new NotFoundException('User not found');
        }
        if (String(follower._id) === String(followed._id)) {
            throw new ConflictException('You cannot follow yourself!');
        }
        if (
            follower.follows.some(
                (item) => String(item) === String(followed._id),
            )
        ) {
            throw new ConflictException('You are already following this user!');
        }

        await this.users.findByIdAndUpdate(followed._id, {
            $push: {
                notifications: {
                    is_read: false,
                    time: new Date(),
                    type: 'follow',
                    user: follower._id,
                },
            },
        });

        const followedDoc = await this.users
            .findByIdAndUpdate(
                followed._id,
                { $addToSet: { followers: follower._id } },
                { new: true },
            )
            .lean<UserLean>();
        const followerDoc = await this.users
            .findByIdAndUpdate(
                follower._id,
                { $addToSet: { follows: followed._id } },
                { new: true },
            )
            .lean<UserLean>();

        return {
            follower: this.sanitize(followerDoc),
            followed: this.sanitize(followedDoc),
        };
    }

    async unfollow(userId: string, actor: Actor) {
        const followed = await this.users.findById(userId).lean<UserLean>();
        const follower = await this.users.findById(actor.id).lean<UserLean>();
        if (!followed || !follower) {
            throw new NotFoundException('User not found');
        }
        if (String(follower._id) === String(followed._id)) {
            throw new ConflictException('You cannot unfollow yourself!');
        }
        if (
            !follower.follows.some(
                (item) => String(item) === String(followed._id),
            )
        ) {
            throw new ConflictException('You are not following this user!');
        }

        await this.users.findByIdAndUpdate(followed._id, {
            $push: {
                notifications: {
                    is_read: false,
                    time: new Date(),
                    type: 'unfollow',
                    user: follower._id,
                },
            },
        });

        const followedDoc = await this.users
            .findByIdAndUpdate(
                followed._id,
                { $pull: { followers: follower._id } },
                { new: true },
            )
            .lean<UserLean>();
        const followerDoc = await this.users
            .findByIdAndUpdate(
                follower._id,
                { $pull: { follows: followed._id } },
                { new: true },
            )
            .lean<UserLean>();

        return {
            follower: this.sanitize(followerDoc),
            followed: this.sanitize(followedDoc),
        };
    }

    async updateRole(userId: string, newRole: Role, actor: Actor) {
        const user = await this.users.findById(userId).lean<UserLean>();
        if (!user) {
            throw new NotFoundException('User not found');
        }
        if (!canManageRole(actor.role, newRole, user.role)) {
            throw new ForbiddenException(
                "You do not have permission to update this user's role",
            );
        }
        if (user.role === newRole) {
            throw new ConflictException('User already has this role');
        }

        const result = await this.users
            .findByIdAndUpdate(user._id, { role: newRole }, { new: true })
            .lean<UserLean>();
        await this.sessions.deleteMany({
            $or: [
                { user: user._id },
                { user: String(user._id) },
            ],
        });
        await this.logger.log({
            type: 'update_role',
            message: `User ${actor.nick_name} updated role for user ${userId}`,
            data: {
                user: actor.id,
                updated_user: new Types.ObjectId(userId),
                new_role: newRole,
            },
        });
        return this.sanitize(result);
    }

    async create(data: {
        nick_name: string;
        password: string;
        email: string;
        description?: string;
    }) {
        const created = await this.users.create(data);
        return this.sanitize(created.toObject() as UserLean);
    }

    async updateById(id: string, fields: Record<string, unknown>) {
        const result = await this.users
            .findByIdAndUpdate(id, { $set: fields }, { new: true })
            .lean<UserLean>();
        return this.sanitize(result, {
            withNotifications: true,
            withSavedPosts: true,
        });
    }

    async findByEmailInsensitive(
        email: string,
        options?: { withPassword?: boolean },
    ) {
        const escaped = String(email).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const user = await this.users
            .findOne({
                email: { $regex: `^${escaped}$`, $options: 'i' },
            })
            .lean<UserLean>();
        return this.sanitize(user, options);
    }

    async deleteSessions(userId: string) {
        await this.sessions.deleteMany({
            $or: [{ user: userId }, { user: new Types.ObjectId(userId) }],
        });
    }

    async markNotificationsRead(id: string) {
        return this.users
            .findByIdAndUpdate(
                id,
                { $set: { 'notifications.$[].is_read': true } },
                { new: true },
            )
            .lean();
    }

    async getPublicByIds(ids: unknown[]) {
        const objectIds = ids
            .map((id) => String(id))
            .filter((id) => Types.ObjectId.isValid(id))
            .map((id) => new Types.ObjectId(id));
        if (!objectIds.length) {
            return [];
        }
        return this.users
            .find({ _id: { $in: objectIds } })
            .select('_id nick_name avatar is_verified')
            .lean();
    }

    async addNotification(
        userId: unknown,
        notification: {
            type: string;
            user?: unknown;
            post?: unknown;
            comment?: unknown;
            support_request?: string;
            support_status?: string;
        },
    ) {
        const types = [
            'follow',
            'unfollow',
            'comment_post',
            'reply_comment',
            'like_post',
            'support_reply',
            'support_status',
        ];
        if (!types.includes(notification.type)) {
            return null;
        }

        const payload: Record<string, unknown> = {
            type: notification.type,
            is_read: false,
            time: new Date(),
        };
        if (notification.user)
            payload.user = new Types.ObjectId(String(notification.user));
        if (notification.post)
            payload.post = new Types.ObjectId(String(notification.post));
        if (notification.comment)
            payload.comment = new Types.ObjectId(String(notification.comment));
        if (notification.support_request)
            payload.support_request = notification.support_request;
        if (notification.support_status)
            payload.support_status = notification.support_status;

        return this.users.findByIdAndUpdate(
            userId,
            { $push: { notifications: payload } },
            { new: true },
        );
    }

    async removeNotifications(filter: Record<string, unknown>) {
        return this.users.updateMany({}, { $pull: { notifications: filter } });
    }

    async addSavedPost(userId: string, postId: string) {
        return this.users
            .findByIdAndUpdate(
                userId,
                { $addToSet: { saved_posts: postId } },
                { new: true },
            )
            .lean<UserLean>();
    }

    async removeSavedPost(userId: string, postId: string) {
        return this.users
            .findByIdAndUpdate(
                userId,
                { $pull: { saved_posts: postId } },
                { new: true },
            )
            .lean<UserLean>();
    }

    async removePostFromSavedForUsers(postId: string) {
        return this.users.updateMany(
            { saved_posts: postId },
            { $pull: { saved_posts: postId } },
        );
    }
}
