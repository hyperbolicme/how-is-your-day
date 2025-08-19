import React from "react";

function NewsEntry({ article, index }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2">
      <div>
        <img className="w-60" src={article.urlToImage}></img>
      </div>
      <div className="" id={index}>
        <p className="font-bold "> {article.title}</p>
        <p className="text-sm">{article.description}</p>
        <p>
          <a className="text-accentone text-sm" href={article.url}>
            [link]
          </a>
        </p>
      </div>
    </div>
  );
}

export default NewsEntry;
