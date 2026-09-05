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
            visitorId?: string;
            pageReferrer?: string;
            city?: string;
            region?: string;
            country?: string;
            ip?: string;
        },
        actor: Actor | undefined,
        req: Request,
    ) {
        const path = this.sanitizePath(body.pagePath);
        const visitor_id = String(body.visitorId || '').slice(0, 64);
        const referrer = String(body.pageReferrer || '').slice(0, 500);
        const user =
            actor?.id && Types.ObjectId.isValid(actor.id)
                ? new Types.ObjectId(actor.id)
                : null;
        const ip = clientIp(req);
        const geo = await lookupVisitorGeo(req, body);
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

        const [
            pageviews,
            entries,
            unique_visitors,
            unique_users,
            authorized_visits,
            previousPageviews,
            previousEntries,
            previousUnique,
            previousUniqueUsers,
            previousAuthorized,
            new_users,
            new_posts,
            new_comments,
            categories,
            registered_users,
            posts,
            comments,
            likes,
            pageviewSeries,
            entrySeries,
            uniqueSeries,
            paths,
            cities,
            recent,
            devices,
            category_posts,
            activity,
        ] = await Promise.all([
            this.pageViews.countDocuments(currentMatch),
            this.pageViews.countDocuments({ ...currentMatch, is_entry: true }),
            this.pageViews.distinct('visitor_id', currentMatch).then((rows) => rows.filter(Boolean).length),
            this.pageViews.distinct('user', authorized(currentMatch)).then((rows) => rows.filter(Boolean).length),
            this.pageViews.countDocuments(authorized(currentMatch)),
            this.pageViews.countDocuments(previousMatch),
            this.pageViews.countDocuments({ ...previousMatch, is_entry: true }),
            this.pageViews.distinct('visitor_id', previousMatch).then((rows) => rows.filter(Boolean).length),
            this.pageViews.distinct('user', authorized(previousMatch)).then((rows) => rows.filter(Boolean).length),
            this.pageViews.countDocuments(authorized(previousMatch)),
            this.users.countDocuments({ created_date: { $gte: from } }),
            this.posts.countDocuments({ created_date: { $gte: from } }),
            this.comments.countDocuments({ created_date: { $gte: from } }),
            this.categories.estimatedDocumentCount(),
            this.users.estimatedDocumentCount(),
            this.posts.estimatedDocumentCount(),
            this.comments.estimatedDocumentCount(),
            this.likesTotal(),
            this.pageViews.aggregate([
                { $match: currentMatch },
                { $group: { _id: this.dayKeyExpr('created_at'), count: { $sum: 1 } } },
                { $sort: { _id: 1 } },
            ]),
            this.pageViews.aggregate([
                { $match: { created_at: { $gte: from }, is_entry: true } },
                { $group: { _id: this.dayKeyExpr('created_at'), count: { $sum: 1 } } },
                { $sort: { _id: 1 } },
            ]),
            this.pageViews.aggregate([
                { $match: { created_at: { $gte: from } } },
                { $group: { _id: { day: this.dayKeyExpr('created_at'), visitor: '$visitor_id' } } },
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
                { $limit: 8 },
            ]),
            this.pageViews.aggregate([
                { $match: { created_at: { $gte: from } } },
                {
                    $group: {
                        _id: {
                            city: { $ifNull: ['$city', 'Неизвестно'] },
                            country: { $ifNull: ['$country', ''] },
                        },
                        visits: { $sum: 1 },
                        entries: { $sum: { $cond: ['$is_entry', 1, 0] } },
                        unique_visitors: { $addToSet: '$visitor_id' },
                    },
                },
                {
                    $project: {
                        city: '$_id.city',
                        country: '$_id.country',
                        visits: 1,
                        entries: 1,
                        unique_visitors: { $size: '$unique_visitors' },
                        _id: 0,
                    },
                },
                { $sort: { entries: -1, visits: -1 } },
                { $limit: 12 },
            ]),
            this.pageViews
                .find({ created_at: { $gte: from }, is_entry: true })
                .sort({ created_at: -1 })
                .limit(20)
                .select({ created_at: 1, ip: 1, city: 1, region: 1, country: 1, path: 1 })
                .lean(),
            this.pageViews
                .aggregate([
                    { $match: { created_at: { $gte: from } } },
                    { $group: { _id: { $ifNull: ['$device', ''] }, visits: { $sum: 1 } } },
                    { $sort: { visits: -1 } },
                ])
                .then((rows) =>
                    rows
                        .filter((row) => row._id)
                        .map((row) => ({ kind: row._id, visits: row.visits })),
                ),
            this.posts.aggregate([
                { $group: { _id: '$category', posts: { $sum: 1 } } },
                {
                    $lookup: {
                        from: 'categories',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'category',
                    },
                },
                { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        name: { $ifNull: ['$category.name', 'Без категории'] },
                        color: '$category.color',
                        posts: 1,
                        _id: 0,
                    },
                },
                { $sort: { posts: -1 } },
            ]),
            this.logs.aggregate([
                { $match: { date_time: { $gte: from } } },
                { $group: { _id: '$type', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
        ]);

        return {
            days,
            totals: {
                entries,
                unique_visitors,
                unique_users,
                authorized_visits,
                pageviews,
                new_users,
                new_posts,
                new_comments,
                categories,
                registered_users,
                posts,
                comments,
                likes,
                entries_prev: previousEntries,
                unique_visitors_prev: previousUnique,
                unique_users_prev: previousUniqueUsers,
                authorized_visits_prev: previousAuthorized,
                pageviews_prev: previousPageviews,
            },
            series: this.fillDays(days, {
                entries: this.toMap(entrySeries as { _id: string; count: number }[]),
                unique_visitors: this.toMap(uniqueSeries as { _id: string; count: number }[]),
                pageviews: this.toMap(pageviewSeries as { _id: string; count: number }[]),
            }),
            top_paths: paths,
            cities,
            devices,
            categories: category_posts,
            recent_entries: recent,
            activity: (activity as { _id: string; count: number }[]).map((item) => ({
                type: item._id,
                count: item.count,
            })),
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
