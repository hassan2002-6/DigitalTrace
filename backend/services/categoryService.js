/**
 * Maps a visited URL to one of the seeded website categories.
 *
 * Rules are checked in order, so more specific hosts must appear before
 * their parent domain (mail.google.com before google.com).
 */

const CATEGORY_RULES = [
    // Productivity - Google subdomains before google.com
    ['mail.google.com', 'Productivity'],
    ['drive.google.com', 'Productivity'],
    ['docs.google.com', 'Productivity'],
    ['calendar.google.com', 'Productivity'],
    ['meet.google.com', 'Productivity'],
    ['keep.google.com', 'Productivity'],
    ['notion.so', 'Productivity'],
    ['trello.com', 'Productivity'],
    ['asana.com', 'Productivity'],
    ['slack.com', 'Productivity'],
    ['zoom.us', 'Productivity'],
    ['canva.com', 'Productivity'],
    ['figma.com', 'Productivity'],
    ['miro.com', 'Productivity'],
    ['office.com', 'Productivity'],
    ['outlook.com', 'Productivity'],
    ['microsoft.com', 'Productivity'],

    // Education - Google learning subdomains before google.com
    ['classroom.google.com', 'Education'],
    ['scholar.google.com', 'Education'],
    ['wikipedia.org', 'Education'],
    ['coursera.org', 'Education'],
    ['udemy.com', 'Education'],
    ['khanacademy.org', 'Education'],
    ['edx.org', 'Education'],
    ['canvas.instructure.com', 'Education'],
    ['researchgate.net', 'Education'],
    ['arxiv.org', 'Education'],
    ['w3schools.com', 'Education'],
    ['geeksforgeeks.org', 'Education'],
    ['leetcode.com', 'Education'],
    ['hackerrank.com', 'Education'],

    // Technology
    ['github.com', 'Technology'],
    ['gitlab.com', 'Technology'],
    ['stackoverflow.com', 'Technology'],
    ['npmjs.com', 'Technology'],
    ['developer.mozilla.org', 'Technology'],
    ['openai.com', 'Technology'],
    ['chatgpt.com', 'Technology'],
    ['claude.ai', 'Technology'],
    ['anthropic.com', 'Technology'],
    ['vercel.com', 'Technology'],
    ['netlify.com', 'Technology'],
    ['digitalocean.com', 'Technology'],
    ['aws.amazon.com', 'Technology'],
    ['google.com', 'Technology'],

    // Entertainment
    ['youtube.com', 'Entertainment'],
    ['netflix.com', 'Entertainment'],
    ['spotify.com', 'Entertainment'],
    ['tiktok.com', 'Entertainment'],
    ['twitch.tv', 'Entertainment'],
    ['primevideo.com', 'Entertainment'],
    ['disneyplus.com', 'Entertainment'],
    ['hotstar.com', 'Entertainment'],
    ['imdb.com', 'Entertainment'],

    // Social Media
    ['facebook.com', 'Social Media'],
    ['instagram.com', 'Social Media'],
    ['x.com', 'Social Media'],
    ['twitter.com', 'Social Media'],
    ['linkedin.com', 'Social Media'],
    ['reddit.com', 'Social Media'],
    ['pinterest.com', 'Social Media'],
    ['snapchat.com', 'Social Media'],
    ['whatsapp.com', 'Social Media'],
    ['discord.com', 'Social Media'],
    ['telegram.org', 'Social Media'],
    ['quora.com', 'Social Media'],

    // Shopping
    ['amazon.com', 'Shopping'],
    ['daraz.pk', 'Shopping'],
    ['ebay.com', 'Shopping'],
    ['aliexpress.com', 'Shopping'],
    ['flipkart.com', 'Shopping'],
    ['walmart.com', 'Shopping'],
    ['etsy.com', 'Shopping'],
    ['alibaba.com', 'Shopping'],

    // News
    ['bbc.com', 'News'],
    ['cnn.com', 'News'],
    ['aljazeera.com', 'News'],
    ['dawn.com', 'News'],
    ['geo.tv', 'News'],
    ['tribune.com.pk', 'News'],
    ['nytimes.com', 'News'],
    ['theguardian.com', 'News'],
    ['reuters.com', 'News']
];

function getWebsiteCategory(url) {
    let hostname;

    try {
        hostname = new URL(url).hostname.toLowerCase();
    } catch (error) {
        return 'Other';
    }

    for (const [domain, category] of CATEGORY_RULES) {
        if (hostname === domain || hostname.endsWith('.' + domain)) {
            return category;
        }
    }

    return 'Other';
}

module.exports = getWebsiteCategory;
