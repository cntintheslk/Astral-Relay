// Reminder checks every minute
setInterval(async () => {
    const now = Math.floor(Date.now() / 1000);

    // LOAs starting now
    const starting = db.prepare(`
        SELECT * FROM loas
        WHERE status='approved'
        AND start_date <= ? AND start_date > ? - 60
    `).all(now, now);

    for (const loa of starting) {
        const user = await client.users.fetch(loa.user_id).catch(() => null);
        if (user) {
            user.send(`🌙 **Your LOA has now begun.**\nReason: ${loa.reason}`).catch(() => {});
        }
    }

    // LOAs ending soon (24h)
    const endingSoon = db.prepare(`
        SELECT * FROM loas
        WHERE status='approved'
        AND end_date BETWEEN ? AND ?
    `).all(now + 86400, now + 86460);

    for (const loa of endingSoon) {
        const user = await client.users.fetch(loa.user_id).catch(() => null);
        if (user) {
            user.send(`⏳ **Your LOA ends in 24 hours.**`).catch(() => {});
        }
    }

    // LOAs ending now
    const endingNow = db.prepare(`
        SELECT * FROM loas
        WHERE status='approved'
        AND end_date <= ? AND end_date > ? - 60
    `).all(now, now);

    for (const loa of endingNow) {
        const user = await client.users.fetch(loa.user_id).catch(() => null);
        if (user) {
            user.send(`🌅 **Your LOA has ended. Welcome back!**`).catch(() => {});
        }
    }

}, 60 * 1000);
