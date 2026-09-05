const geoCache = new Map<
    string,
    { ip: string; city: string; region: string; country: string }
>();

function normalizeIp(raw: unknown) {
    const value = String(raw || '').trim();
    if (!value) return '';
    if (value.startsWith('::ffff:')) return value.slice(7);
    return value.split('%')[0];
}

function isPrivateIp(ip: string) {
    const normalized = normalizeIp(ip);
    if (
        !normalized ||
        normalized === '127.0.0.1' ||
        normalized === '::1' ||
        normalized === 'localhost'
    ) {
        return true;
    }
    if (normalized.startsWith('10.') || normalized.startsWith('192.168.'))
        return true;
    if (normalized.startsWith('172.')) {
        const second = Number(normalized.split('.')[1]);
        return second >= 16 && second <= 31;
    }
    return false;
}

function firstPublicIp(...candidates: unknown[]) {
    const privateFallback: string[] = [];
    for (const raw of candidates) {
        if (!raw) continue;
        for (const part of String(raw).split(',')) {
            const ip = normalizeIp(part);
            if (!ip) continue;
            if (!isPrivateIp(ip)) return ip;
            privateFallback.push(ip);
        }
    }
    return privateFallback[0] || '';
}

export function clientIp(req: {
    headers?: Record<string, unknown>;
    ip?: string;
    socket?: { remoteAddress?: string };
}) {
    const headers = req.headers || {};
    return firstPublicIp(
        headers['cf-connecting-ip'],
        headers['true-client-ip'],
        headers['x-real-ip'],
        headers['x-forwarded-for'],
        req.ip,
        req.socket?.remoteAddress,
    );
}

function sanitizePlace(value: unknown) {
    return String(value || '')
        .replace(/[<>]/g, '')
        .trim()
        .slice(0, 80);
}

export function formatLocation(
    geo: { city?: string; country?: string } | null | undefined,
    fallback: string,
) {
    const parts = [geo?.city, geo?.country].filter(Boolean);
    if (parts.length) {
        return [...new Set(parts)].join(', ');
    }
    return fallback;
}

export async function lookupVisitorGeo(
    req: {
        headers?: Record<string, unknown>;
        ip?: string;
        socket?: { remoteAddress?: string };
    },
    body?: { city?: string; region?: string; country?: string; ip?: string },
) {
    const ip = clientIp(req);
    const city = sanitizePlace(body?.city);
    const country = sanitizePlace(body?.country);
    const region = sanitizePlace(body?.region);
    const hintIp = normalizeIp(body?.ip);

    if (city || country) {
        return {
            ip: isPrivateIp(hintIp) ? ip : hintIp || ip,
            city,
            region,
            country,
        };
    }

    const address = !isPrivateIp(ip) ? ip : !isPrivateIp(hintIp) ? hintIp : ip;
    const cacheKey = isPrivateIp(address)
        ? `private:${address || 'none'}`
        : address;

    if (geoCache.has(cacheKey)) {
        return {
            ...geoCache.get(cacheKey)!,
            ip: address || geoCache.get(cacheKey)!.ip,
        };
    }

    if (isPrivateIp(address)) {
        const empty = { ip: address, city: '', region: '', country: '' };
        geoCache.set(cacheKey, empty);
        return empty;
    }

    try {
        const response = await fetch(
            `https://ipwho.is/${encodeURIComponent(address)}`,
            {
                signal: AbortSignal.timeout(2000),
                headers: { 'User-Agent': 'scribo-session' },
            },
        );
        const data = (await response.json()) as {
            success?: boolean;
            ip?: string;
            city?: string;
            region?: string;
            country?: string;
        };
        if (data?.success) {
            const result = {
                ip: address || data.ip || '',
                city: data.city || '',
                region: data.region || '',
                country: data.country || '',
            };
            geoCache.set(cacheKey, result);
            return result;
        }
    } catch {
        // fallback
    }

    const fallback = { ip: address, city: '', region: '', country: '' };
    geoCache.set(cacheKey, fallback);
    return fallback;
}
