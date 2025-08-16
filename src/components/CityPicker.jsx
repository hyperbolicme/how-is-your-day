import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';

export default function CityPicker() {
  const [selectedCity, setSelectedCity] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const dropdownRef = useRef(null);
  const chevronRef = useRef(null);
  const itemsRef = useRef([]);

  const cities = [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
    'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
    'Austin', 'Jacksonville', 'Fort Worth', 'Columbus', 'Charlotte',
    'San Francisco', 'Indianapolis', 'Seattle', 'Denver', 'Washington',
    'Boston', 'El Paso', 'Nashville', 'Detroit', 'Oklahoma City',
    'Portland', 'Las Vegas', 'Memphis', 'Louisville', 'Baltimore',
    'Milwaukee', 'Albuquerque', 'Tucson', 'Fresno', 'Sacramento',
    'Mesa', 'Kansas City', 'Atlanta', 'Long Beach', 'Colorado Springs'
  ];

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setIsOpen(false);
    setSearchTerm('');
  };

  // GSAP animations
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      // Animate dropdown open
      gsap.fromTo(dropdownRef.current, 
        { 
          opacity: 0, 
          y: -10,
          scale: 0.95
        },
        { 
          opacity: 1, 
          y: 0,
          scale: 1,
          duration: 0.2,
          ease: "power2.out"
        }
      );
      
      // Animate chevron rotation
      gsap.to(chevronRef.current, {
        rotation: 180,
        duration: 0.3,
        ease: "power2.out"
      });

      // Stagger animate city items
      gsap.fromTo(itemsRef.current,
        { opacity: 0, x: -20 },
        { 
          opacity: 1, 
          x: 0,
          duration: 0.3,
          stagger: 0.02,
          delay: 0.1,
          ease: "power2.out"
        }
      );
    } else if (!isOpen && chevronRef.current) {
      // Animate chevron back
      gsap.to(chevronRef.current, {
        rotation: 0,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  }, [isOpen, filteredCities]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      
      
      {/* Dropdown trigger */}
      <div 
        className="relative cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between">
          <span className={selectedCity ? 'text-gray-900' : 'text-gray-500'}>
            {selectedCity || 'Choose a city...'}
          </span>
          <svg 
            ref={chevronRef}
            className="w-5 h-5 text-gray-400"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden"
        >
          {/* Search input */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search cities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              autoFocus
            />
          </div>
          
          {/* Cities list */}
          <div className="max-h-40 overflow-y-auto">
            {filteredCities.length > 0 ? (
              filteredCities.map((city, index) => (
                <div
                  key={city}
                  ref={el => itemsRef.current[index] = el}
                  onClick={() => handleCitySelect(city)}
                  onMouseEnter={(e) => {
                    gsap.to(e.target, {
                      x: 5,
                      duration: 0.2,
                      ease: "power2.out"
                    });
                  }}
                  onMouseLeave={(e) => {
                    gsap.to(e.target, {
                      x: 0,
                      duration: 0.2,
                      ease: "power2.out"
                    });
                  }}
                  className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition-colors ${
                    selectedCity === city ? 'bg-blue-100 text-blue-600' : 'text-gray-900'
                  }`}
                >
                  {city}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-500 text-sm">
                No cities found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}