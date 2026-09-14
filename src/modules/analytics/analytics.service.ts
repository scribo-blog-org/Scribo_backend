import { createHash } from 'crypto';
import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { Request } from 'express';
import { PERMISSIONS } from '../../authz/permissions';
import { hasPermission, type Actor } from '../../authz/policy';
import { parseDevice, parseDeviceKind } from '../../common/device';
import { clientIp, lookupVisitorGeo } from '../../common/geo';
import { AppLog } from '../../database/schemas/log.schema';
import { Category } from '../../database/schemas/category.schema';
import { PageView } from '../../database/schemas/page-view.schema';
import { Post } from '../../database/schemas/post.schema';
import { PostComment } from '../../database/schemas/post-comment.schema';
import { User } from '../../database/schemas/user.schema';
import { SearchQueryLog } from '../../database/schemas/search-query.schema';
import { Session } from '../../database/schemas/session.schema';

const DEDUPE_MS = 8000;
const SESSION_MS = 30 * 60 * 1000;

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectModel(PageView.name) private readonly pageViews: Model<PageView>,
        @InjectModel(User.name) private readonly users: Model<User>,
        @InjectModel(Post.name) private readonly posts: Model<Post>,
        @InjectModel(PostComment.name)
        private readonly comments: Model<PostComment>,
        @InjectModel(Category.name) private readonly categories: Model<Category>,
        @InjectModel(AppLog.name) private readonly logs: Model<AppLog>,
        @InjectModel(SearchQueryLog.name)
        private readonly searchLogs: Model<SearchQueryLog>,
        @InjectModel(Session.name) private readonly sessions: Model<Session>,
    ) {}

    private utcDayString(date: Date) {
        return date.toISOString().slice(0, 10);
    }

    private rangeStart(days: number) {
        const start = new Date();
        start.setUTCHours(0, 0, 0, 0);
        start.setUTCDate(start.getUTCDate() - (days - 1));
        return start;
    }

    private parseDays(value?: string | number) {
        const days = Number.parseInt(String(value || '14'), 10);
        return [7, 14, 30].includes(days) ? days : 14;
    }

    private sanitizePath(path?: string) {
        const raw = String(path || '')
            .split('?')[0]
            .split('#')[0]
            .trim();
        if (!raw.startsWith('/')) return '/';
        return raw.slice(0, 200);
    }

    private dayKeyExpr(field: string) {
        return {
            $dateToString: {
                format: '%Y-%m-%d',
                date: `$${field}`,
                timezone: 'UTC',
            },
        };
    }

    private toMap(rows: { _id: string; count: number }[]) {
        const map = new Map<string, number>();
        for (const row of rows) map.set(row._id, row.count);
        return map;
    }

    private resolveVisitorId(actor: Actor | undefined, req: Request) {
        if (actor?.id) {
            return `u:${actor.id}`;
        }

        const ip = clientIp(req);
        const userAgent = String(req.headers['user-agent'] || '');
        const digest = createHash('sha256')
            .update(`${ip}|${userAgent}`)
            .digest('hex')
            .slice(0, 32);

        return `a:${digest}`;
    }

    private fillDays(days: number, maps: Record<string, Map<string, number>>) {
        const start = this.rangeStart(days);
        const series = [];
        for (let i = 0; i < days; i += 1) {
            const day = new Date(start);
            day.setUTCDate(start.getUTCDate() + i);
            const key = this.utcDayString(day);
            const point: Record<string, unknown> = { date: key };
            for (const [name, map] of Object.entries(maps)) {
                point[name] = map.get(key) || 0;
            }
            series.push(point);
        }
        return series;
    }

    async trackVisit(
        body: {
            pagePath?: string;
            pageReferrer?: string;
        },
        actor: Actor | undefined,
        req: Request,
    ) {
        const path = this.sanitizePath(body.pagePath);
        const visitor_id = this.resolveVisitorId(actor, req);
        const referrer = String(body.pageReferrer || '').slice(0, 500);
        const user =
            actor?.id && Types.ObjectId.isValid(actor.id)
                ? new Types.ObjectId(actor.id)
                : null;
        const ip = clientIp(req);
        const geo = await lookupVisitorGeo(req);
        const userAgent = String(req.headers['user-agent'] || '');

        const recent = await this.pageViews
            .findOne({
                visitor_id,
                path,
                created_at: { $gte: new Date(Date.now() - DEDUPE_MS) },
            })
            .lean();
        if (recent) return recent;

        const lastVisit = await this.pageViews
            .findOne({ visitor_id })
            .sort({ created_at: -1 })
            .select({ created_at: 1 })
            .lean();
        const is_entry =
            !lastVisit ||
            Date.now() - new Date(lastVisit.created_at).getTime() > SESSION_MS;

        const created = await this.pageViews.create({
            path,
            visitor_id,
            referrer,
            user,
            ip: geo.ip || ip,
            city: geo.city,
            region: geo.region,
            country: geo.country,
            device: parseDevice(userAgent),
            device_kind: parseDeviceKind(userAgent),
            is_entry,
        });
        return created.toObject();
    }

    private withPercent<T extends Record<string, unknown>>(
        items: T[],
        valueKey: keyof T,
    ) {
        const total = items.reduce(
            (sum, item) => sum + Number(item[valueKey] || 0),
            0,
        );

        return items.map((item) => ({
            ...item,
            percent: total
                ? Math.round((Number(item[valueKey] || 0) / total) * 100)
                : 0,
        }));
    }

    private async periodActivity(from: Date) {
        const [
            logRows,
            commentsCreated,
            logins,
            newUsers,
        ] = await Promise.all([
            this.logs.aggregate([
                {
                    $match: {
                        date_time: { $gte: from },
                        type: {
                            $in: [
                                'create_post',
                                'update_post',
                                'delete_post',
                                'register',
                                'comment_post',
                                'reply_comment',
                                'update_comment',
                                'delete_comment',
                                'like_post',
                            ],
                        },
                    },
                },
                { $group: { _id: '$type', count: { $sum: 1 } } },
            ]),
            this.comments.countDocuments({ created_date: { $gte: from } }),
            this.sessions.countDocuments({ createdAt: { $gte: from } }),
            this.users.countDocuments({ created_date: { $gte: from } }),
        ]);

        const counts = new Map(
            (logRows as { _id: string; count: number }[]).map((row) => [
                row._id,
                row.count,
            ]),
        );

        const commentsWritten =
            commentsCreated ||
            (counts.get('comment_post') || 0) +
                (counts.get('reply_comment') || 0);

        return {
            posts: {
                created: counts.get('create_post') || 0,
                updated: counts.get('update_post') || 0,
                deleted: counts.get('delete_post') || 0,
            },
            users: {
                registered: newUsers || counts.get('register') || 0,
                logins,
            },
            comments: {
                created: commentsWritten,
                updated: counts.get('update_comment') || 0,
                deleted: counts.get('delete_comment') || 0,
            },
            likes: {
                posts: counts.get('like_post') || 0,
            },
        };
    }

    async getDashboard(query: { days?: string }, actor: Actor) {
        if (!hasPermission(actor, PERMISSIONS.VIEW_LOGS)) {
            throw new ForbiddenException(
                "You don't have permission to view analytics",
            );
        }
        const days = this.parseDays(query.days);
        const from = this.rangeStart(days);
        const previousFrom = this.rangeStart(days * 2);
        const previousMatch = { created_at: { $gte: previousFrom, $lt: from } };
        const currentMatch = { created_at: { $gte: from } };
        const authorized = (base: object) => ({
            ...base,
            user: { $exists: true, $ne: null },
        });
        const anonymous = (base: object) => ({
            ...base,
            $or: [{ user: { $exists: false } }, { user: null }],
        });

        const [
            unique_visitors,
            previousUnique,
            authorized_visits,
            anonymous_visits,
            uniqueSeries,
            paths,
            searchInsights,
            contentTags,
            topPosts,
            activity,
        ] = await Promise.all([
            this.pageViews
                .distinct('visitor_id', currentMatch)
                .then((rows) => rows.filter(Boolean).length),
            this.pageViews
                .distinct('visitor_id', previousMatch)
                .then((rows) => rows.filter(Boolean).length),
            this.pageViews.countDocuments(authorized(currentMatch)),
            this.pageViews.countDocuments(anonymous(currentMatch)),
            this.pageViews.aggregate([
                { $match: { created_at: { $gte: from } } },
                {
                    $group: {
                        _id: {
                            day: this.dayKeyExpr('created_at'),
                            visitor: '$visitor_id',
                        },
                    },
                },
                { $group: { _id: '$_id.day', count: { $sum: 1 } } },
                { $sort: { _id: 1 } },
            ]),
            this.pageViews.aggregate([
                { $match: { created_at: { $gte: from } } },
                {
                    $group: {
                        _id: '$path',
                        visits: { $sum: 1 },
                        unique_visitors: { $addToSet: '$visitor_id' },
                    },
                },
                {
                    $project: {
                        path: '$_id',
                        visits: 1,
                        unique_visitors: { $size: '$unique_visitors' },
                        _id: 0,
                    },
                },
                { $sort: { visits: -1 } },
                { $limit: 5 },
            ]),
            this.searchInsights(from, previousFrom),
            this.contentHashtags(5),
            this.posts
                .find({ views_count: { $gt: 0 } })
                .select('_id title views_count')
                .sort({ views_count: -1 })
                .limit(5)
                .lean(),
            this.periodActivity(from),
        ]);

        const visitTotal = authorized_visits + anonymous_visits;
        const audience = {
            authorized_visits,
            anonymous_visits,
            authorized_percent: visitTotal
                ? Math.round((authorized_visits / visitTotal) * 100)
                : 0,
            anonymous_percent: visitTotal
                ? Math.round((anonymous_visits / visitTotal) * 100)
                : 0,
        };

        return {
            days,
            totals: {
                unique_visitors,
                unique_visitors_prev: previousUnique,
            },
            series: this.fillDays(days, {
                visitors: this.toMap(
                    uniqueSeries as { _id: string; count: number }[],
                ),
            }),
            activity,
            audience,
            top_paths: this.withPercent(
                paths as Array<{ path: string; visits: number }>,
                'visits',
            ),
            top_posts: (
                topPosts as Array<{
                    _id: unknown;
                    title: string;
                    views_count?: number;
                }>
            ).map((post) => ({
                _id: post._id,
                title: post.title,
                views_count: Number(post.views_count || 0),
            })),
            top_queries: this.withPercent(
                searchInsights.top_queries as Array<{
                    query: string;
                    count: number;
                }>,
                'count',
            ),
            top_hashtags: this.withPercent(
                contentTags.top as Array<{
                    tag: string;
                    uses: number;
                    posts: number;
                    comments: number;
                }>,
                'uses',
            ),
        };
    }

    private extractHashtags(text: string) {
        const plain = String(text || '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&[a-zA-Z0-9#]+;/g, ' ')
            .toLowerCase();
        return plain.match(/#[^\s#]+/g) || [];
    }

    private async contentHashtags(limit = 5) {
        const [postDocs, commentDocs] = await Promise.all([
            this.posts
                .find({
                    $or: [
                        { title: { $regex: '#' } },
                        { content_text: { $regex: '#' } },
                    ],
                })
                .select('title content_text')
                .lean(),
            this.comments
                .find({ comment_text: { $regex: '#' } })
                .select('comment_text')
                .lean(),
        ]);

        const postsByTag = new Map<string, number>();
        const commentsByTag = new Map<string, number>();
        let postsWithTags = 0;

        for (const post of postDocs) {
            const tags = [
                ...new Set(
                    this.extractHashtags(`${post.title} ${post.content_text || ''}`),
                ),
            ];
            if (!tags.length) {
                continue;
            }
            postsWithTags += 1;
            for (const tag of tags) {
                postsByTag.set(tag, (postsByTag.get(tag) || 0) + 1);
            }
        }

        for (const comment of commentDocs) {
            const tags = [
                ...new Set(this.extractHashtags(comment.comment_text || '')),
            ];
            for (const tag of tags) {
                commentsByTag.set(tag, (commentsByTag.get(tag) || 0) + 1);
            }
        }

        const tags = new Set([...postsByTag.keys(), ...commentsByTag.keys()]);
        const top = [...tags]
            .map((tag) => ({
                tag,
                posts: postsByTag.get(tag) || 0,
                comments: commentsByTag.get(tag) || 0,
                uses:
                    (postsByTag.get(tag) || 0) + (commentsByTag.get(tag) || 0),
            }))
            .sort((a, b) => b.uses - a.uses || b.posts - a.posts)
            .slice(0, limit);

        return {
            top,
            posts_with_hashtags: postsWithTags,
            unique_hashtags: tags.size,
        };
    }

    private async searchInsights(from: Date, previousFrom: Date) {
        const currentMatch = { created_at: { $gte: from } };
        const previousMatch = {
            created_at: { $gte: previousFrom, $lt: from },
        };
        const [
            searches,
            searches_prev,
            empty,
            empty_prev,
            hashtag_searches,
            unique_queries,
            series,
            top_queries,
            top_hashtag_queries,
            zero_queries,
        ] = await Promise.all([
            this.searchLogs.countDocuments(currentMatch),
            this.searchLogs.countDocuments(previousMatch),
            this.searchLogs.countDocuments({ ...currentMatch, hits: 0 }),
            this.searchLogs.countDocuments({ ...previousMatch, hits: 0 }),
            this.searchLogs.countDocuments({
                ...currentMatch,
                kind: 'hashtag',
            }),
            this.searchLogs
                .distinct('query', currentMatch)
                .then((rows) => rows.filter(Boolean).length),
            this.searchLogs.aggregate([
                { $match: currentMatch },
                {
                    $group: {
                        _id: this.dayKeyExpr('created_at'),
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
            this.searchLogs.aggregate([
                { $match: currentMatch },
                {
                    $group: {
                        _id: '$query',
                        count: { $sum: 1 },
                        hits: { $sum: '$hits' },
                        empty: {
                            $sum: { $cond: [{ $eq: ['$hits', 0] }, 1, 0] },
                        },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: 5 },
                {
                    $project: {
                        query: '$_id',
                        count: 1,
                        hits: 1,
                        empty: 1,
                        _id: 0,
                    },
                },
            ]),
            this.searchLogs.aggregate([
                { $match: { ...currentMatch, kind: 'hashtag' } },
                { $group: { _id: '$query', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 8 },
                { $project: { query: '$_id', count: 1, _id: 0 } },
            ]),
            this.searchLogs.aggregate([
                { $match: { ...currentMatch, hits: 0 } },
                { $group: { _id: '$query', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 8 },
                { $project: { query: '$_id', count: 1, _id: 0 } },
            ]),
        ]);

        return {
            searches,
            searches_prev,
            empty,
            empty_prev,
            hashtag_searches,
            unique_queries,
            series: series as { _id: string; count: number }[],
            top_queries,
            top_hashtag_queries,
            zero_queries,
        };
    }

    private async likesTotal() {
        const [posts, comments] = await Promise.all([
            this.posts.aggregate([
                { $project: { n: { $size: { $ifNull: ['$likes', []] } } } },
                { $group: { _id: null, count: { $sum: '$n' } } },
            ]),
            this.comments.aggregate([
                { $project: { n: { $size: { $ifNull: ['$likes', []] } } } },
                { $group: { _id: null, count: { $sum: '$n' } } },
            ]),
        ]);
        return (posts[0]?.count || 0) + (comments[0]?.count || 0);
    }
}
