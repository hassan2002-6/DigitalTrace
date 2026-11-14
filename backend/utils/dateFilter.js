
function isValidDate(dateString) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);

    if (!match) {
        return false;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    // MySQL DATE/DATETIME supported year range
    if (year < 1000 || year > 9999) {
        return false;
    }

    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

function getDateFilter(query) {
    const { startDate, endDate } = query;

    if (!startDate && !endDate) {
        return {
            condition: '',
            values: []
        };
    }

    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (
        (startDate && !datePattern.test(startDate)) ||
        (endDate && !datePattern.test(endDate))
    ) {
        throw new Error('Invalid date format. Use YYYY-MM-DD');
    }

    if (startDate && !isValidDate(startDate)) {
        throw new Error('Invalid start date');
    }

    if (endDate && !isValidDate(endDate)) {
        throw new Error('Invalid end date');
    }

    if (startDate && endDate && startDate > endDate) {
        throw new Error('Start date cannot be after end date');
    }

    let condition = '';
    const values = [];

    if (startDate) {
        condition += ' AND bh.visit_time >= ?';
        values.push(startDate + ' 00:00:00');
    }

    if (endDate) {
        condition += ' AND bh.visit_time < DATE_ADD(?, INTERVAL 1 DAY)';
        values.push(endDate);
    }

    return {
        condition,
        values
    };
}

module.exports = getDateFilter;
