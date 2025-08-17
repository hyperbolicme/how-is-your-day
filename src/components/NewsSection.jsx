import React from "react";

function NewsSection() {
  return (
    <section className="min-h-screen flex items-start justify-start bg-secondaryone text-primaryone">
      <div className="px-40 py-10">
        <h1 className="float-animate text-accentone font-poiret font-bold text-3xl lg:text-5xl">
          News
        </h1>
        <p className="font-bold text-"> Headline</p>
        <p> News blurb and link</p>
        <p className="font-bold"> Headline</p>
        <p> News blurb and link</p>
        <p className="font-bold"> Headline</p>
        <p> News blurb and link</p>
      </div>
    </section>
  );
}

export default NewsSection;