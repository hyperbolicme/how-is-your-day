import React, { useState } from "react";
import NewsEntry from "./NewsEntry";

function NewsSection({ country, userInput = false }) {
  console.log("News section country :", country);
  const [news, setNews] = useState(null);

  async function getNews(country) {
    const apiKey = import.meta.env.VITE_NEWS_API_KEY;
    const query = `https://newsapi.org/v2/top-headlines?country=${country}&apiKey=${apiKey}`;

    const res = await fetch(query);
    const data = await res.json();

    console.log("api string: ", query);
    console.log("news :", data);
    setNews(data);
  }
  const handleGetNews = () => {
    console.log("country = ", country);
    getNews(country);
  };
  let pullNews = userInput;
  if(pullNews) {
    handleGetNews();
    pullNews = false;
  }
    

  return (
    <section className="min-h-screen flex items-start justify-start bg-secondaryone text-primaryone">
      <div className="px-10 py-10">
        <h1 className="py-3 float-animate text-accentone font-poiret font-bold text-3xl lg:text-5xl">
          News in {country.toUpperCase()}
        </h1>

        {/* <div className="px-0 py-3">
          <button
            onClick={handleGetNews}
            className="w-full bg-primaryone text-textlight px-4 py-2 rounded-lg hover:bg-accentone"
          >
            Get news
          </button>
        </div> */}
        { news &&
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
