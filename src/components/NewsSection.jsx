import React from "react";

function NewsSection() {
  return (
    <section className="min-h-[67vh] flex items-start justify-start bg-secondaryone ">
      <div className="px-40 py-10">
        <h1 className="text-primaryone font-poiret font-bold text-3xl lg:text-5xl">
          News
        </h1>
        <p className="font-bold"> Headline</p>
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