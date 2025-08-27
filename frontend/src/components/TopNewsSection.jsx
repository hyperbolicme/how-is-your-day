import React, { useState, useEffect } from "react";
import { TrendingUp, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import ApiService from "../services/api";

const TopNewsSection = ({ country, setIsLoading }) => {
  const [newsArticles, setNewsArticles] = useState([]);
  const [error, setError] = useState(null);
  const [newsSource, setNewsSource] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const MAX_ARTICLES = 10;

  async function fetchNews(countryCode) {
    try {
      console.log("Fetching news for country:", countryCode);
      setError(null);

      // Use combined endpoint for best results
      const response = await ApiService.getNewsCombined(countryCode);
      
      if (response.success) {
        const articles = response.data.articles.slice(0, MAX_ARTICLES).map(article => ({
          id: article.id,
          title: article.title,
          description: article.description || 'Click to read more...',
          imageUrl: article.imageUrl || 'https://via.placeholder.com/400x250/86BBB5/FFFFFF?text=News',
          publishedAt: new Date(article.publishedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          url: article.url,
          source: article.source || 'Unknown Source'
        }));

        setNewsArticles(articles);
        setNewsSource(response.data.source);
        console.log(`Loaded ${articles.length} articles from ${response.data.source}`);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
      setError(error.message);
      setNewsArticles([]);
    }
  }

  const handleRefresh = async () => {
    if (!country) return;
    
    setIsRefreshing(true);
    await fetchNews(country);
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (!country) return;

    async function loadNews() {
      setIsLoading(true);
      await fetchNews(country);
      setIsLoading(false);
    }

    loadNews();
  }, [country, setIsLoading]);

  const handleArticleClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Error State
  if (error) {
    return (
      <div className="space-y-6">
        <div
          className="backdrop-blur-lg border rounded-3xl p-8"
          style={{
            backgroundColor: "rgba(167, 190, 205, 0.1)",
            borderColor: "rgba(167, 190, 205, 0.2)",
          }}
        >
          <div className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{color: "#A7BECD"}} />
            <h3 className="text-xl font-semibold mb-4" style={{ color: "#F9FAFB" }}>
              News Service Unavailable
            </h3>
            <p className="mb-4" style={{ color: "rgba(167, 190, 205, 0.8)" }}>
              {error}
            </p>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors disabled:opacity-50"
              style={{
                backgroundColor: "rgba(167, 190, 205, 0.2)",
                color: "#F9FAFB"
              }}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Retrying...' : 'Try Again'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Component
  return (
    <div className="space-y-6">
      <div
        className="backdrop-blur-lg border rounded-3xl p-8"
        style={{
          backgroundColor: "rgba(167, 190, 205, 0.1)",
          borderColor: "rgba(167, 190, 205, 0.2)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-6 h-6" style={{ color: "#A7BECD" }} />
            <h3 className="text-xl font-semibold" style={{ color: "#F9FAFB" }}>
              Today's Top News
            </h3>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Source Badge */}
            {newsSource && (
              <div className="text-xs px-3 py-1 rounded-full" 
                   style={{ 
                     backgroundColor: "rgba(167, 190, 205, 0.2)",
                     color: "rgba(167, 190, 205, 0.9)"
                   }}>
                {newsSource === 'guardian' ? '📰 Guardian' : '📺 NewsAPI'}
              </div>
            )}
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg hover:bg-opacity-20 transition-colors disabled:opacity-50"
              style={{backgroundColor: "rgba(167, 190, 205, 0.1)"}}
              title="Refresh news"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
                        style={{color: "#A7BECD"}} />
            </button>
          </div>
        </div>

        {/* News Articles */}
        <div className="space-y-6">
          {newsArticles.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-30" style={{color: "#A7BECD"}} />
              <p style={{ color: "rgba(167, 190, 205, 0.8)" }}>
                No news available for this region
              </p>
              <p className="text-sm mt-2" style={{ color: "rgba(167, 190, 205, 0.6)" }}>
                Try searching for a different city
              </p>
            </div>
          ) : (
            newsArticles.map((article, index) => (
              <div 
                key={article.id} 
                className="group cursor-pointer hover:bg-opacity-10 rounded-xl p-3 -m-3 transition-all duration-200"
                onClick={() => handleArticleClick(article.url)}
                style={{backgroundColor: "transparent"}}
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Image */}
                  <div className="sm:w-32 sm:h-20 w-full h-40 flex-shrink-0">
                    <div
                      className="w-full h-full rounded-xl overflow-hidden group-hover:scale-105 transition-transform duration-300"
                      style={{
                        backgroundColor: "rgba(167, 190, 205, 0.05)",
                      }}
                    >
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x250/86BBB5/FFFFFF?text=📰+News';
                        }}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <h4
                      className="font-semibold leading-snug group-hover:opacity-80 transition-colors"
                      style={{ 
                        color: "#F9FAFB",
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {article.title}
                    </h4>
                    
                    <p 
                      className="text-sm leading-relaxed" 
                      style={{ 
                        color: "rgba(167, 190, 205, 0.8)",
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {article.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <div
                        className="text-xs flex items-center space-x-2"
                        style={{ color: "rgba(167, 190, 205, 0.6)" }}
                      >
                        <span>{article.publishedAt}</span>
                        <span>•</span>
                        <span>{article.source}</span>
                      </div>
                      
                      <ExternalLink 
                        className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" 
                        style={{ color: "#A7BECD" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Separator */}
                {index < newsArticles.length - 1 && (
                  <div
                    className="border-b mt-6"
                    style={{
                      borderColor: "rgba(167, 190, 205, 0.1)",
                    }}
                  ></div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Info */}
        {newsArticles.length > 0 && (
          <div className="mt-6 pt-4 border-t" 
               style={{borderColor: "rgba(167, 190, 205, 0.1)"}}>
            <div className="flex items-center justify-between text-xs" 
                 style={{color: "rgba(167, 190, 205, 0.6)"}}>
              <span>Showing {newsArticles.length} of latest articles</span>
              <span>Click any article to read more</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopNewsSection;