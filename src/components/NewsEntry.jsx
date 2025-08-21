import React from "react";

function NewsEntry({ article, index }) {
  return (
    <div className="grid grid-cols-5 ">
      <div className="col-span-1 py-2">
        <img className="w-60" src={article?.urlToImage}></img>
      </div>
      <div className="col-span-4 py-2 px-5" id={index}>
        <p className="font-bold "> {article?.title}</p>
        <p className="text-sm">{article?.description}</p>
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
