
function getWebsiteCategory(url) {
    let hostname;

    try {
        hostname = new URL(url).hostname.toLowerCase();
    } catch (error) {
        return null;
    }

    const categories = {
        'google.com': 'Technology',
        'youtube.com': 'Entertainment',
        'github.com': 'Technology',
        'wikipedia.org': 'Education',
        'facebook.com': 'Social Media',
        'instagram.com': 'Social Media',
        'x.com': 'Social Media',
        'twitter.com': 'Social Media',
        'linkedin.com': 'Social Media',
        'amazon.com': 'Shopping',
        'daraz.pk': 'Shopping',
        'netflix.com': 'Entertainment',
        'reddit.com': 'Social Media',
        'bbc.com': 'News',
        'cnn.com': 'News'
    };

    for (const domain in categories) {
        if (
            hostname === domain ||
            hostname.endsWith('.' + domain)
        ) {
            return categories[domain];
        }
    }

    return null;
}

module.exports = getWebsiteCategory;
