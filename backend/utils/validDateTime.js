
function isValidDateTime(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(value);

    if (!match) {
        return false;
    }

    const [, year, month, day, hour, minute, second] = match.map(Number);

    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day &&
        hour <= 23 &&
        minute <= 59 &&
        second <= 59
    );
}

module.exports = isValidDateTime;
