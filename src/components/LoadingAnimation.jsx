import React from "react";

const LoadingAnimation = () => {
  return (
    <div className="flex justify-center items-center py-20">
      <div
        className="animate-spin rounded-full h-16 w-16 border-4 border-t-4"
        style={{
          borderColor: "rgba(167, 205, 201, 0.2)",
          borderTopColor: "#A7CDC9",
        }}
      ></div>
    </div>
  );
};

export default LoadingAnimation;