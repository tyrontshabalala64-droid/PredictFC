 // src/components/FootballNews.jsx
import React, { useState, useEffect, useRef } from 'react';
import { fetchFootballNews, fetchPSLNews } from '../services/newsService';
import { 
    Newspaper, 
    ExternalLink, 
    Clock, 
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Globe,
    Trophy
} from 'lucide-react';

export default function FootballNews({ limit = 5, showSearch = false }) {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        loadNews();
        
        return () => {
            mountedRef.current = false;
        };
    }, [activeTab]);

    const loadNews = async (showRefresh = false) => {
        if (showRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }
        setError(null);
        
        try {
            let data;
            if (activeTab === 'psl') {
                data = await fetchPSLNews(20);
            } else {
                data = await fetchFootballNews(20);
            }
            
            if (mountedRef.current) {
                if (data && data.length > 0) {
                    setArticles(data);
                    setHasLoaded(true);
                } else {
                    setArticles([]);
                    setHasLoaded(false);
                    setError(activeTab === 'psl' ? 'No PSL news available right now.' : 'No football news available right now.');
                }
            }
        } catch (error) {
            console.error('Error loading news:', error);
            if (mountedRef.current) {
                setError('Failed to load news. Please try again.');
                setHasLoaded(false);
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    };

    if (loading || !hasLoaded) {
        return null;
    }

    if (articles.length === 0) {
        return null;
    }

    const getTimeAgo = (dateString) => {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            return `${diffDays}d ago`;
        } catch (e) {
            return 'Recent';
        }
    };

    const displayArticles = expanded ? articles : articles.slice(0, limit);
    const hasMore = articles.length > limit;

    // Count PSL articles
    const pslCount = articles.filter(a => a.isPSL).length;

    return (
        <div className="mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Newspaper size={18} className="text-blue-500" />
                    <h2 className="text-sm font-bold text-gray-800">Football News</h2>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {articles.length}
                    </span>
                    {activeTab === 'psl' && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                            🇿🇦 PSL
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => loadNews(true)}
                        disabled={refreshing}
                        className="text-xs text-gray-400 hover:text-blue-500 transition flex items-center gap-1"
                    >
                        <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? '...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Tab Selector */}
            <div className="flex gap-2 mb-3">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 ${
                        activeTab === 'all'
                            ? 'bg-gray-800 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    <Globe size={12} /> All
                </button>
                <button
                    onClick={() => setActiveTab('psl')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition flex items-center gap-1 ${
                        activeTab === 'psl'
                            ? 'bg-gray-800 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                    <Trophy size={12} /> 🇿🇦 PSL {pslCount > 0 && `(${pslCount})`}
                </button>
                {hasMore && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="px-3 py-1 rounded-full text-xs font-medium transition bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center gap-1 ml-auto"
                    >
                        {expanded ? (
                            <>Show Less <ChevronUp size={12} /></>
                        ) : (
                            <>See All ({articles.length}) <ChevronDown size={12} /></>
                        )}
                    </button>
                )}
            </div>

            {/* News List */}
            <div className="space-y-2">
                {displayArticles.map((article, index) => {
                    const hasValidImage = article.image && 
                        !article.image.includes('placeholder') && 
                        !article.image.includes('default') &&
                        article.image.startsWith('http');
                    
                    const isPSL = article.isPSL || false;
                    
                    return (
                        <a
                            key={`${article.title}-${index}`}
                            href={article.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-white rounded-xl shadow-sm border border-gray-100 p-3 hover:shadow-md transition hover:border-blue-200 group"
                        >
                            <div className="flex items-start gap-3">
                                {/* Image */}
                                {hasValidImage ? (
                                    <img 
                                        src={article.image} 
                                        alt="" 
                                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                                        loading="lazy"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className={`w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 ${isPSL ? 'bg-gradient-to-br from-green-600 to-yellow-500' : 'bg-gradient-to-br from-blue-400 to-purple-500'}`}>
                                        <span className="text-2xl">{isPSL ? '🇿🇦' : (article.icon || '⚽')}</span>
                                    </div>
                                )}
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${isPSL ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {isPSL ? '🇿🇦 PSL' : (article.source || 'News')}
                                        </span>
                                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                            <Clock size={10} />
                                            {getTimeAgo(article.pubDate)}
                                        </span>
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mt-0.5 group-hover:text-blue-600 transition">
                                        {article.title}
                                    </h3>
                                    {article.description && (
                                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                                            {article.description}
                                        </p>
                                    )}
                                </div>
                                
                                <ExternalLink size={14} className="text-gray-300 flex-shrink-0 mt-1 group-hover:text-blue-500 transition" />
                            </div>
                        </a>
                    );
                })}
            </div>

            {/* Show Less button at bottom when expanded */}
            {expanded && hasMore && (
                <button
                    onClick={() => setExpanded(false)}
                    className="w-full mt-3 py-2 text-xs text-gray-400 hover:text-blue-500 transition bg-gray-50 rounded-lg hover:bg-blue-50 flex items-center justify-center gap-1"
                >
                    <ChevronUp size={14} /> Show Less
                </button>
            )}
        </div>
    );
}