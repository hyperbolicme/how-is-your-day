import React, { useEffect, useState } from "react";
import NewsEntry from "./NewsEntry";

function NewsSection({ country, userInput = false, setUserInput }) {
  console.log("News section country :", country);
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function getNews(country) {
    const apiKey = import.meta.env.VITE_NEWS_API_KEY;
    const query = `https://newsapi.org/v2/top-headlines?country=${country}&apiKey=${apiKey}`;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(query);
      if (!res.ok) throw new Error("News API failed");
      const data = await res.json();

      console.log("api string: ", query);
      console.log("news :", data);

      setNews(data);
      setUserInput(false);
    } catch (error) {
      console.error("Error fetching news: ", error);
      setError("Failed to fetch news. Try again.");
    } finally {
      setLoading(false);
    }
  }
  const handleGetNews = () => {
    console.log("country = ", country);
    getNews(country);
  };

  useEffect(() => {
    if (userInput && country) {
      handleGetNews();
    }
  }, [userInput, country]);

  return (
    <section className="min-h-screen flex items-start justify-start bg-secondaryone text-primaryone">
      <div className="px-10 py-10">
        <h1 className="py-3 float-animate text-accentone font-poiret font-bold text-3xl lg:text-5xl">
          News in {country.toUpperCase()}
        </h1>

        {news &&
          news.articles &&
          news.articles.map(
            (article, index) =>
              index < 10 && (
                <NewsEntry article={article} index={index}></NewsEntry>
              )
          )}
      </div>
    </section>
  );
}

export default NewsSection;
