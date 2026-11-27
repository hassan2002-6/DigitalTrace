/**
 * PostgreSQL date-range filters for the browser_history table.
 * Returns SQL fragments using positional parameters ($1, $2, ...).
 */
function isValidDate(dateString) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);

    if (!match) {
        return false;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

function buildDateFilter(query, startIndex = 2) {
    const startDate = typeof query.startDate === 'string' ? query.startDate.trim() : '';
    const endDate = typeof query.endDate === 'string' ? query.endDate.trim() : '';

    if (!startDate && !endDate) {
        return { conditions: [], values: [] };
    }

    if (startDate && !isValidDate(startDate)) {
        throw new Error('Invalid start date. Use YYYY-MM-DD');
    }

    if (endDate && !isValidDate(endDate)) {
        throw new Error('Invalid end date. Use YYYY-MM-DD');
    }

    if (startDate && endDate && startDate > endDate) {
        throw new Error('Start date cannot be after end date');
    }

    const conditions = [];
    const values = [];
    let index = startIndex;

    if (startDate) {
        conditions.push(`bh.visit_time >= $${index}::date`);
        values.push(startDate);
        index += 1;
    }

    if (endDate) {
        conditions.push(`bh.visit_time < ($${index}::date + INTERVAL '1 day')`);
        values.push(endDate);
    }

    return { conditions, values };
}

module.exports = { buildDateFilter, isValidDate };
