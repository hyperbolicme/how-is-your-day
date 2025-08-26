import React, { useState, useEffect } from "react";
import { TrendingUp } from "lucide-react";

const TopNewsSection = ({ country, setIsLoading }) => {
  const [newsG, setNewsG] = useState(null);
  const MAX_ARTICLES = 10;

  function getNewsArticles() {
    if (!newsG) return null;
    let newsArticles = [];
    const topNews = newsG.slice(0, MAX_ARTICLES);

    topNews?.map((article) => {
      let n = {};
      n.id = article.id;
      n.imgsrc = article.fields?.thumbnail;
      n.title = article.webTitle;
      n.published = new Date(article.webPublicationDate).toLocaleDateString();
      n.url = article.webUrl;

      newsArticles.push(n);
    });
    return newsArticles;
  }

  // NewsAPI 
  async function getNews(country) {
    const apiKey = import.meta.env.VITE_NEWS_API_KEY;
    const query = `https://newsapi.org/v2/top-headlines?country=${country}&apiKey=${apiKey}`;

    setError(null);

    try {
      const res = await fetch(query);
      if (!res.ok) throw new Error("News API failed");
      const data = await res.json();

      console.log("Query: NewsAPI ");
      console.log("news :", data);

      setNews(data);
      // setUserInput(false);
    } catch (error) {
      console.error("Error fetching news: ", error);
      setError("Failed to fetch news. Try again.");
      setNews(null);
    } finally {
    }
  }

  // Guardian API
  async function getNewsGuardian(countryCode) {
    const apiKey = import.meta.env.VITE_NEWS_GUARDIAN_API_KEY;
    const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
    const query = `https://content.guardianapis.com/search?q=${regionNames.of(
      countryCode
    )}&api-key=${apiKey}&show-fields=thumbnail&order-by=relevance`;

    try {
      const res = await fetch(query);
      if (!res.ok) throw new Error("News Guardian API failed");
      const data = await res.json();
      if (data.response.status != "ok") throw new Error("Guardian API failed");

      console.log("Query: Guardian NewsAPI ");
      console.log("g news :", data);

      setNewsG(data.response.results);
      // setNews(data);
    } catch (error) {
      console.error("Error fetching news: ", error);
      setError("Failed to fetch news. Try again.");
      setNewsG(null);
    } finally {
    }
  }

  useEffect(() => {
    setIsLoading(true);
    console.log("country changed to :", country);
    getNewsGuardian(country);
    setIsLoading(false);
  }, [country]);

  useEffect(() => {
    console.log("news articles :", getNewsArticles());
  }, [newsG]);

  return (
    <div className="space-y-6">
      <div
        className="backdrop-blur-lg border rounded-3xl p-8"
        style={{
          backgroundColor: "rgba(167, 190, 205, 0.1)",
          borderColor: "rgba(167, 190, 205, 0.2)",
        }}
      >
        <div className="flex items-center space-x-3 mb-6">
          <TrendingUp className="w-6 h-6" style={{ color: "#A7BECD" }} />
          <h3 className="text-xl font-semibold" style={{ color: "#F9FAFB" }}>
            Today's Top News
          </h3>
        </div>
        <div className="space-y-6">
          {getNewsArticles()?.map((article, index) => (
            <div key={article.id} className="group cursor-pointer">
              <div
                className="aspect-video rounded-xl overflow-hidden mb-3 group-hover:bg-opacity-20 transition-colors"
                style={{
                  backgroundColor: "rgba(167, 190, 205, 0.05)",
                }}
              >
                <img
                  // alt={article?.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  src={article.imgsrc}
                />
              </div>
              <div className="space-y-2">
                <h4
                  className="font-semibold leading-snug group-hover:opacity-80 transition-colors"
                  style={{ color: "#F9FAFB" }}
                >
                  {article.title}
                </h4>

                <div
                  className="text-xs"
                  style={{ color: "rgba(167, 190, 205, 0.6)" }}
                >
                  {article.published}
                  <a href={article.url}> Read More</a>
                </div>
              </div>
              {index < MAX_ARTICLES - 1 && (
                <div
                  className="border-b mt-6"
                  style={{
                    borderColor: "rgba(167, 190, 205, 0.1)",
                  }}
                ></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TopNewsSection;
