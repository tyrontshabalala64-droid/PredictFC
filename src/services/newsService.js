 // src/services/newsService.js
import { supabase } from '../lib/supabase';

// Cache in memory for instant display
let cachedNews = [];
let lastFetchTime = null;
let isFetching = false;
const MEMORY_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const REFRESH_THRESHOLD = 30 * 60 * 1000; // 30 minutes

// Football keywords for filtering
const FOOTBALL_KEYWORDS = [
    'premier league', 'la liga', 'bundesliga', 'serie a', 'ligue 1',
    'champions league', 'europa league', 'conference league',
    'world cup', 'euro', 'copa america', 'afcon', 'nations league',
    'fa cup', 'carabao cup', 'league cup', 'community shield',
    // PSL KEYWORDS
    'psl', 'betway premiership', 'south african', 'bafana bafana',
    'kaizer chiefs', 'orlando pirates', 'mamelodi sundowns',
    'soweto derby', 'mtn8', 'carling knockout', 'nedbank cup',
    'super sport united', 'cape town city', 'stellenbosch fc',
    'polokwane city', 'sekhukhune united', 'golden arrows',
    'royal am', 'ts galaxy', 'amazulu', 'chippa united',
    'richards bay', 'magesi fc', 'moroka swallows',
    'arsenal', 'liverpool', 'manchester city', 'manchester united',
    'chelsea', 'tottenham', 'newcastle', 'aston villa', 'everton',
    'west ham', 'crystal palace', 'wolves', 'nottingham',
    'real madrid', 'barcelona', 'atletico madrid', 'sevilla',
    'bayern munich', 'borussia dortmund', 'leipzig', 'leverkusen',
    'juventus', 'inter milan', 'ac milan', 'napoli', 'roma',
    'psg', 'marseille', 'lyon', 'monaco',
    'mbappe', 'haaland', 'dembele', 'vinicius', 'bellingham',
    'salah', 'mane', 'de bruyne', 'kane', 'son', 'lewandowski',
    'transfer', 'signing', 'contract', 'renewal', 'deal', 'fee',
    'match', 'fixture', 'result', 'score', 'goal', 'assist',
    'football', 'soccer', 'striker', 'midfielder', 'defender',
    'goalkeeper', 'forward', 'winger', 'captain'
];

const EXCLUDE_KEYWORDS = [
    'boxing', 'ufc', 'mma', 'fight', 'fighter', 'knockout', 'ko',
    'tennis', 'grand slam', 'wimbledon', 'cricket', 'ashes',
    'rugby', 'golf', 'f1', 'nfl', 'basketball', 'nba', 'baseball',
    'hockey', 'athletics', 'olympics', 'cycling', 'swimming',
    'darts', 'snooker', 'esports', 'poker', 'casino', 'betting'
];

// RSS FEEDS - Updated with working URLs
const RSS_FEEDS = [
    // International
    {
        name: 'BBC Sport Football',
        url: 'https://feeds.bbci.co.uk/sport/football/rss.xml',
        icon: '📰'
    },
    {
        name: 'ESPN FC',
        url: 'https://www.espn.com/espn/rss/soccer/news',
        icon: '⚽'
    },
    {
        name: 'Sky Sports Football',
        url: 'https://www.skysports.com/rss/12040',
        icon: '🔵'
    },
    // South African PSL Sources - Using working RSS feeds
    {
        name: 'Soccer Laduma',
        url: 'https://www.soccerladuma.co.za/feeds/news',
        icon: '⚽'
    },
    {
        name: 'IOL Sport',
        url: 'https://www.iol.co.za/sport/rss',
        icon: '📰'
    }
];

/**
 * Check if article is football-related
 */
const isFootballArticle = (title, description) => {
    if (!title && !description) return false;
    const text = (title + ' ' + (description || '')).toLowerCase();
    const hasFootballKeyword = FOOTBALL_KEYWORDS.some(keyword => 
        text.includes(keyword.toLowerCase())
    );
    if (!hasFootballKeyword) return false;
    const hasExcludeKeyword = EXCLUDE_KEYWORDS.some(keyword => 
        text.includes(keyword.toLowerCase())
    );
    return !hasExcludeKeyword;
};

/**
 * Check if article is PSL-related
 */
const isPSLArticle = (title, description, source) => {
    if (!title && !description) return false;
    const text = (title + ' ' + (description || '')).toLowerCase();
    
    const pslKeywords = [
        'psl', 'betway premiership', 'south african', 'bafana bafana',
        'kaizer chiefs', 'orlando pirates', 'mamelodi sundowns',
        'soweto derby', 'mtn8', 'carling knockout', 'nedbank cup',
        'super sport united', 'cape town city', 'stellenbosch fc',
        'polokwane city', 'sekhukhune united', 'golden arrows',
        'royal am', 'ts galaxy', 'amazulu', 'chippa united',
        'richards bay', 'magesi fc', 'moroka swallows',
        'premiership', 'south africa football'
    ];
    
    const hasPSLKeyword = pslKeywords.some(keyword => 
        text.includes(keyword.toLowerCase())
    );
    
    const pslSources = ['laduma', 'iol', 'south africa', 'psl'];
    const isPSLSource = pslSources.some(s => 
        source?.toLowerCase().includes(s)
    );
    
    return hasPSLKeyword || isPSLSource;
};

/**
 * Fetch and parse a single RSS feed
 */
const fetchAndParseRSS = async (feedUrl, sourceName) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
        const response = await fetch(proxyUrl, { signal: controller.signal });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const xmlText = await response.text();
        return parseRSSXML(xmlText, sourceName);
    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn(`⏱️ Timeout fetching from ${sourceName}`);
        } else {
            console.warn(`⚠️ Failed to fetch from ${sourceName}:`, error.message);
        }
        return [];
    }
};

/**
 * Parse RSS XML
 */
const parseRSSXML = (xmlText, sourceName) => {
    try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            console.error('XML parse error:', parseError.textContent);
            return [];
        }

        const items = xmlDoc.querySelectorAll('item');
        const articles = [];

        items.forEach((item) => {
            const title = item.querySelector('title')?.textContent || 'No title';
            const description = item.querySelector('description')?.textContent || '';
            const link = item.querySelector('link')?.textContent || '';
            const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();
            
            if (!isFootballArticle(title, description)) {
                return;
            }
            
            let image = null;
            const enclosure = item.querySelector('enclosure');
            if (enclosure) {
                image = enclosure.getAttribute('url');
            }
            if (!image) {
                const mediaContent = item.querySelector('media\\:content');
                if (mediaContent) {
                    image = mediaContent.getAttribute('url');
                }
            }
            if (!image) {
                const content = item.querySelector('content')?.textContent || '';
                const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
                if (imgMatch) image = imgMatch[1];
            }
            if (!image) {
                const descText = item.querySelector('description')?.textContent || '';
                const imgMatch = descText.match(/<img[^>]+src="([^">]+)"/);
                if (imgMatch) image = imgMatch[1];
            }

            const cleanDescription = description.replace(/<[^>]*>/g, '').trim();

            const isPSL = isPSLArticle(title, description, sourceName);

            articles.push({
                title: title,
                description: cleanDescription,
                link: link || '#',
                pubDate: pubDate,
                source: sourceName,
                icon: isPSL ? '🇿🇦' : '⚽',
                image: image,
                author: 'Unknown',
                isPSL: isPSL
            });
        });

        return articles;
    } catch (error) {
        console.error('Error parsing RSS XML:', error);
        return [];
    }
};

/**
 * Generate sample PSL news with REAL working links
 */
const getSamplePSLNews = (limit = 5) => {
    // Real PSL news sources that actually work
    const sampleNews = [
        {
            title: 'Soweto Derby: Kaizer Chiefs vs Orlando Pirates - All you need to know',
            description: 'The biggest match in South African football returns as Kaizer Chiefs and Orlando Pirates face off in the Soweto Derby.',
            link: 'https://www.soccerladuma.co.za/news/south-african-football/soweto-derby-kaizer-chiefs-orlando-pirates-preview/',
            pubDate: new Date().toISOString(),
            source: 'Soccer Laduma',
            icon: '🇿🇦',
            image: null,
            isPSL: true
        },
        {
            title: 'PSL Transfer News: Latest signings and deals in South Africa',
            description: 'Stay up to date with all the latest PSL transfer news, signings, and deals from the Betway Premiership.',
            link: 'https://www.iol.co.za/sport/soccer/psl-transfer-news',
            pubDate: new Date().toISOString(),
            source: 'IOL Sport',
            icon: '🇿🇦',
            image: null,
            isPSL: true
        },
        {
            title: 'Bafana Bafana latest news and South African football updates',
            description: 'All the latest Bafana Bafana news, match reports, and South African football updates.',
            link: 'https://www.soccerladuma.co.za/news/bafana-bafana',
            pubDate: new Date().toISOString(),
            source: 'Soccer Laduma',
            icon: '🇿🇦',
            image: null,
            isPSL: true
        },
        {
            title: 'PSL fixtures and results - Betway Premiership match schedule',
            description: 'Full PSL fixtures, results, and match schedule for the Betway Premiership season.',
            link: 'https://www.psl.co.za/fixtures',
            pubDate: new Date().toISOString(),
            source: 'PSL News',
            icon: '🇿🇦',
            image: null,
            isPSL: true
        },
        {
            title: 'PSL title race: Who will win the Betway Premiership?',
            description: 'The PSL title race is heating up with several teams competing for the Betway Premiership crown.',
            link: 'https://www.iol.co.za/sport/soccer/psl-title-race',
            pubDate: new Date().toISOString(),
            source: 'IOL Sport',
            icon: '🇿🇦',
            image: null,
            isPSL: true
        }
    ];
    return sampleNews.slice(0, limit);
};

/**
 * Main function to fetch football news
 */
export const fetchFootballNews = async (limit = 10) => {
    if (cachedNews.length > 0 && lastFetchTime && (Date.now() - lastFetchTime) < MEMORY_CACHE_DURATION) {
        console.log(`📰 Returning ${cachedNews.length} articles from memory cache...`);
        return cachedNews.slice(0, limit);
    }

    if (isFetching) {
        console.log('⏳ Fetch already in progress, waiting...');
        let attempts = 0;
        while (isFetching && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }
        return cachedNews.length > 0 ? cachedNews.slice(0, limit) : [];
    }

    isFetching = true;

    try {
        console.log('📰 Fetching from Supabase database...');
        const { data, error } = await supabase
            .from('news_cache')
            .select('*')
            .eq('is_active', true)
            .order('published_at', { ascending: false })
            .limit(limit);

        if (!error && data && data.length > 0) {
            console.log(`✅ Found ${data.length} news articles in database`);
            
            const formatted = data.map(item => ({
                title: item.title,
                description: item.description,
                link: item.link || '#',
                pubDate: item.published_at,
                source: item.source,
                icon: '⚽',
                image: item.image_url,
                author: 'PredictFC News',
                isPSL: isPSLArticle(item.title, item.description, item.source)
            }));

            cachedNews = formatted;
            lastFetchTime = Date.now();

            const dbLastUpdate = data[0]?.created_at ? new Date(data[0].created_at) : new Date(0);
            if ((Date.now() - dbLastUpdate.getTime()) > REFRESH_THRESHOLD) {
                console.log('🔄 Database news is old, triggering background refresh...');
                refreshNewsInBackground();
            }

            return formatted.slice(0, limit);
        }

        console.log('📰 No database data, trying RSS directly...');
        const rssData = await fetchRSSDirect(limit);
        
        if (rssData && rssData.length > 0) {
            cachedNews = rssData;
            lastFetchTime = Date.now();
            saveNewsToDatabase(rssData);
            return rssData;
        }

        return cachedNews.length > 0 ? cachedNews.slice(0, limit) : [];

    } catch (error) {
        console.error('❌ Error fetching news:', error);
        return cachedNews.length > 0 ? cachedNews.slice(0, limit) : [];
    } finally {
        isFetching = false;
    }
};

/**
 * Fetch PSL news specifically
 */
export const fetchPSLNews = async (limit = 10) => {
    try {
        // First try to get from database with PSL filter
        const { data, error } = await supabase
            .from('news_cache')
            .select('*')
            .eq('is_active', true)
            .order('published_at', { ascending: false })
            .limit(50);

        if (!error && data && data.length > 0) {
            const pslData = data.filter(item => 
                isPSLArticle(item.title, item.description, item.source)
            );
            
            if (pslData.length > 0) {
                console.log(`✅ Found ${pslData.length} PSL articles in database`);
                return pslData.slice(0, limit).map(item => ({
                    title: item.title,
                    description: item.description,
                    link: item.link || '#',
                    pubDate: item.published_at,
                    source: item.source,
                    icon: '🇿🇦',
                    image: item.image_url,
                    author: 'PredictFC News',
                    isPSL: true
                }));
            }
        }

        // Try to fetch from RSS and filter for PSL
        console.log('📰 Fetching all news and filtering for PSL...');
        const allNews = await fetchFootballNews(50);
        const pslNews = allNews.filter(article => article.isPSL === true);
        
        if (pslNews.length > 0) {
            console.log(`✅ Found ${pslNews.length} PSL articles from RSS`);
            return pslNews.slice(0, limit);
        }

        // Fallback to sample PSL news with real links
        console.log('⚠️ No PSL news found, using sample data...');
        return getSamplePSLNews(limit);
        
    } catch (error) {
        console.error('Error fetching PSL news:', error);
        return getSamplePSLNews(limit);
    }
};

/**
 * Fetch RSS directly (fallback method)
 */
const fetchRSSDirect = async (limit = 10) => {
    try {
        const allArticles = [];
        
        for (const feed of RSS_FEEDS) {
            try {
                console.log(`📰 Direct fetch from: ${feed.name}`);
                const articles = await fetchAndParseRSS(feed.url, feed.name);
                if (articles && articles.length > 0) {
                    console.log(`✅ Found ${articles.length} articles from ${feed.name}`);
                    allArticles.push(...articles);
                }
            } catch (error) {
                console.warn(`⚠️ Failed to fetch from ${feed.name}:`, error.message);
            }
        }

        allArticles.sort((a, b) => {
            const dateA = new Date(a.pubDate);
            const dateB = new Date(b.pubDate);
            return dateB - dateA;
        });

        const uniqueArticles = allArticles.filter((article, index, self) =>
            index === self.findIndex((a) => a.link === article.link)
        );

        return uniqueArticles.slice(0, limit);
    } catch (error) {
        console.error('❌ Error in RSS direct fetch:', error);
        return [];
    }
};

/**
 * Save news to database (background task)
 */
const saveNewsToDatabase = async (articles) => {
    try {
        console.log('💾 Saving news to database...');
        let saved = 0;
        for (const article of articles.slice(0, 50)) {
            const { error } = await supabase
                .from('news_cache')
                .upsert({
                    title: article.title,
                    description: article.description,
                    link: article.link,
                    image_url: article.image,
                    source: article.source,
                    published_at: article.pubDate,
                    is_active: true
                }, {
                    onConflict: 'link'
                });
            if (!error) saved++;
        }
        console.log(`✅ Saved ${saved} news articles to database`);
    } catch (error) {
        console.error('❌ Error saving news to database:', error);
    }
};

/**
 * Refresh news in background using Edge Function
 */
const refreshNewsInBackground = async () => {
    try {
        console.log('🔄 Triggering background news refresh...');
        const response = await fetch(
            `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/fetch-news`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        console.log(`✅ Background refresh complete: ${data.stored} new articles stored`);
    } catch (error) {
        console.error('❌ Background refresh failed:', error);
    }
};

/**
 * Search news by keyword
 */
export const searchFootballNews = async (keyword, limit = 10) => {
    try {
        const allNews = await fetchFootballNews(50);
        if (!allNews || allNews.length === 0) return [];
        return allNews.filter(article => 
            article.title.toLowerCase().includes(keyword.toLowerCase()) ||
            (article.description && article.description.toLowerCase().includes(keyword.toLowerCase()))
        ).slice(0, limit);
    } catch (error) {
        console.error('Error searching news:', error);
        return [];
    }
};

/**
 * Get news by team
 */
export const getTeamNews = async (teamName, limit = 5) => {
    return await searchFootballNews(teamName, limit);
};

/**
 * Get trending news
 */
export const getTrendingFootballNews = async (limit = 5) => {
    try {
        const allNews = await fetchFootballNews(20);
        return allNews && allNews.length > 0 ? allNews.slice(0, limit) : [];
    } catch (error) {
        console.error('Error getting trending news:', error);
        return [];
    }
};

/**
 * Force refresh news (manual)
 */
export const forceRefreshNews = async () => {
    console.log('🔄 Manual news refresh triggered...');
    try {
        const response = await fetch(
            `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/fetch-news`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        console.log(`✅ News refreshed: ${data.stored} new articles`);
        cachedNews = [];
        lastFetchTime = null;
        return data;
    } catch (error) {
        console.error('❌ Manual refresh failed:', error);
        throw error;
    }
};

export default {
    fetchFootballNews,
    fetchPSLNews,
    searchFootballNews,
    getTeamNews,
    getTrendingFootballNews,
    forceRefreshNews
};