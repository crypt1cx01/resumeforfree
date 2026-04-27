import type { D1Database } from '@cloudflare/workers-types';

interface PublicStats {
    users: number;
    resumes: number;
    downloads: number;
}

const DEFAULT_STATS: PublicStats = { users: 0, resumes: 0, downloads: 0 };
const ONE_HOUR = 60 * 60;

const fetchStatsFromDb = async (db: D1Database): Promise<PublicStats> => {
    const result = await db
        .prepare(`SELECT name, count FROM counters WHERE name IN ('users', 'resumes', 'downloads')`)
        .all<{ name: string; count: number }>();

    const stats = { ...DEFAULT_STATS };
    for (const row of result.results ?? []) {
        if (row.name in stats) {
            (stats as Record<string, number>)[row.name] = row.count ?? 0;
        }
    }
    return stats;
};

export default defineCachedEventHandler(async (event): Promise<PublicStats> => {
    const db = event.context.cloudflare?.env?.DB as D1Database | undefined;
    if (!db) return DEFAULT_STATS;

    try {
        return await fetchStatsFromDb(db);
    }
    catch (error) {
        console.error('Failed to fetch stats:', error);
        return DEFAULT_STATS;
    }
}, {
    name: 'public-stats',
    maxAge: ONE_HOUR,
    swr: true,
    staleMaxAge: ONE_HOUR,
    getKey: () => 'public-stats',
});
