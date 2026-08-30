 // supabase/functions/fetch-news/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// RSS Feeds
const RSS_FEEDS = [
    {
        name: 'BBC Sport Football',
        url: 'https://feeds.bbci.co.uk/sport/football/rss.xml',
    },
    {
        name: 'ESPN FC',
        url: 'https://www.espn.com/espn/rss/soccer/news',
    },
    {
        name: 'Sky Sports Football',
        url: 'https://www.skysports.com/rss/12040',
    },
];

const FOOTBALL_KEYWORDS = [
    'premier league', 'la liga', 'bundesliga', 'serie a', 'ligue 1',
    'champions league', 'europa league', 'conference league',
    'world cup', 'euro', 'copa america', 'afcon', 'nations league',
    'fa cup', 'carabao cup', 'league cup', 'community shield',
    'psl', 'south african', 'mamelodi', 'sundowns', 'orlando pirates',
    'kaizer chiefs', 'super sport united', 'amakhosi', 'buccaneers',
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
];

const EXCLUDE_KEYWORDS = [
    'boxing', 'ufc', 'mma', 'fight', 'fighter', 'knockout', 'ko',
    'tennis', 'grand slam', 'wimbledon', 'cricket', 'ashes',
    'rugby', 'golf', 'f1', 'nfl', 'basketball', 'nba', 'baseball',
    'hockey', 'athletics', 'olympics', 'cycling', 'swimming',
    'darts', 'snooker', 'esports', 'poker', 'casino', 'betting'
];

const isFootballArticle = (title, description) => {
    const text = (title + ' ' + (description || '')).toLowerCase();
    const hasKeyword = FOOTBALL_KEYWORDS.some(k => text.includes(k));
    if (!hasKeyword) return false;
    const hasExclude = EXCLUDE_KEYWORDS.some(k => text.includes(k));
    return !hasExclude;
};

const parseRSSXML = (xmlText, sourceName) => {
    try {
        const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
        const items = doc.querySelectorAll('item');
        const articles = [];

        items.forEach((item) => {
            const title = item.querySelector('title')?.textContent || '';
            const description = item.querySelector('description')?.textContent || '';
            const link = item.querySelector('link')?.textContent || '';
            const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();

            if (!isFootballArticle(title, description)) return;

            let image = null;
            const enclosure = item.querySelector('enclosure');
            if (enclosure) {
                image = enclosure.getAttribute('url');
            }
            if (!image) {
                const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
                if (imgMatch) image = imgMatch[1];
            }
            if (!image) {
                const content = item.querySelector('content')?.textContent || '';
                const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
                if (imgMatch) image = imgMatch[1];
            }

            const cleanDescription = description.replace(/<[^>]*>/g, '').trim();

            articles.push({
                title: title.trim(),
                description: cleanDescription,
                link: link.trim(),
                image_url: image,
                source: sourceName,
                published_at: new Date(pubDate).toISOString(),
            });
        });

        return articles;
    } catch (error) {
        console.error('Error parsing RSS:', error);
        return [];
    }
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Use the SERVICE_ROLE_KEY secret (not starting with SUPABASE_)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SERVICE_ROLE_KEY') ?? '',  // ← Changed from SUPABASE_SERVICE_ROLE_KEY
        )

        console.log('📰 Fetching football news...');
        const allArticles = [];

        for (const feed of RSS_FEEDS) {
            try {
                console.log(`📰 Fetching from: ${feed.name}`);
                const response = await fetch(feed.url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const xmlText = await response.text();
                const articles = parseRSSXML(xmlText, feed.name);
                console.log(`✅ Found ${articles.length} articles from ${feed.name}`);
                allArticles.push(...articles);
            } catch (error) {
                console.error(`❌ Failed to fetch ${feed.name}:`, error.message);
            }
        }

        // Sort by date
        allArticles.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));

        // Remove duplicates
        const uniqueArticles = allArticles.filter((article, index, self) =>
            index === self.findIndex((a) => a.link === article.link)
        );

        console.log(`✅ Total unique articles: ${uniqueArticles.length}`);

        // Store in database
        let inserted = 0;
        for (const article of uniqueArticles.slice(0, 50)) {
            const { error } = await supabaseClient
                .from('news_cache')
                .upsert({
                    title: article.title,
                    description: article.description,
                    link: article.link,
                    image_url: article.image_url,
                    source: article.source,
                    published_at: article.published_at,
                    is_active: true
                }, {
                    onConflict: 'link'
                });

            if (!error) inserted++;
        }

        console.log(`✅ Stored ${inserted} news articles in database`);

        return new Response(JSON.stringify({
            success: true,
            total: uniqueArticles.length,
            stored: inserted,
            articles: uniqueArticles.slice(0, 20)
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});