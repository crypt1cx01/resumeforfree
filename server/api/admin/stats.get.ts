import type { D1Database } from '@cloudflare/workers-types';
import { count, eq } from 'drizzle-orm';
import { contactMessages } from '../../database/schema';

export default defineEventHandler(async (event) => {
    await requireAdmin(event);

    try {
        const db = useDrizzle(event);
        const rawDb = event.context.cloudflare?.env?.DB as D1Database | undefined;

        const [countersResult, newMessagesResult] = await Promise.all([
            rawDb
                ? rawDb.prepare(`SELECT name, count FROM counters WHERE name IN ('users', 'resumes', 'contact_messages', 'downloads')`).all<{ name: string; count: number }>()
                : Promise.resolve({ results: [] }),
            db.select({ count: count() }).from(contactMessages).where(eq(contactMessages.status, 'new')),
        ]);

        const counters = Object.fromEntries(
            (countersResult?.results || []).map(r => [r.name, r.count]),
        );

        return {
            totalUsers: counters.users || 0,
            totalResumes: counters.resumes || 0,
            totalMessages: counters.contact_messages || 0,
            newMessages: newMessagesResult[0]?.count || 0,
            totalDownloads: counters.downloads || 0,
        };
    }
    catch (error) {
        console.error('Error fetching admin stats:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to fetch statistics',
        });
    }
});
