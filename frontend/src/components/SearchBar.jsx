import React, { useState } from "react";
import { Search } from "lucide-react";

const SearchBar = ({ setCurrentCity, setIsLoading }) => {
  const [city, setCity] = useState("");

  const handleSearch = async (e) => {
    console.log("handleSearch city :", city);
    e.preventDefault();
    if (city.trim()) {
      setCurrentCity(city); // this will trigger getweather&getforecast and if needed getnews
      setCity("");
    }
  };

  return (
    <div className="max-w-md mx-auto mb-12">
      <div className="relative">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch(e)}
          placeholder="Enter city name..."
          className="w-full px-6 py-4 backdrop-blur-md border rounded-2xl focus:outline-none focus:ring-2 transition-all"
          style={{
            backgroundColor: "rgba(167, 205, 201, 0.1)",
            borderColor: "rgba(167, 205, 201, 0.3)",
            color: "#F9FAFB",
            "::placeholder": { color: "rgba(167, 205, 201, 0.7)" },
          }}
        />
        <button
          onClick={handleSearch}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 transition-colors"
          style={{ color: "rgba(167, 205, 201, 0.8)" }}
        >
          <Search className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
