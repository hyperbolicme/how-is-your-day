import React from "react";

const HeroSection = () => {
  const HERO_TITLE = "How is your day?";
  const HERO_SUBTITLE = "Weather insights and top stories for your city";

  return (
    <div className="text-center mb-12">
      <h1
        className="text-5xl font-bold mb-4"
        style={{
          background:
            "linear-gradient(135deg, #F9FAFB 0%, #A7CDC9 50%, #A7BECD 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {HERO_TITLE}
      </h1>
      <p className="text-lg" style={{ color: "#A7CDC9" }}>
        {HERO_SUBTITLE}
      </p>
    </div>
  );
};

export default HeroSection;
