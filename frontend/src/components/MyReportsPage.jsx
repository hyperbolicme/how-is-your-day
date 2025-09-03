import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Download, 
  Calendar, 
  MapPin, 
  RefreshCw, 
  AlertCircle,
  ArrowLeft,
  Clock,
  HardDrive,
  Cloud
} from "lucide-react";

import { generateReportPDF } from "../utils/pdfGenerator";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function MyReportsPage ({ onBack }) {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storageLocation, setStorageLocation] = useState(null);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Fetching reports list...");
      
      const response = await fetch(`${API_BASE_URL}/api/my-reports`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      if (data.success) {
        setReports(data.data.reports);
        setStorageLocation(data.data.storage_location);
        console.log(`Loaded ${data.data.reports.length} reports from ${data.data.storage_location}`);
      } else {
        throw new Error(data.error || 'Failed to fetch reports');
      }
      
    } catch (error) {
      console.error("Error fetching reports:", error);
      setError(error.message);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleReportClick = async (filename) => {
    try {
      console.log(`Generating PDF for report: ${filename}`);
      
      // Fetch the report data
      const response = await fetch(`${API_BASE_URL}/api/report/${filename}`);
      const data = await response.json();
      
      if (data.success) {
        console.log("Report data fetched, generating PDF...");
        
        // Generate PDF from the report data
        const pdfResult = generateReportPDF(data.data.report, filename);
        
        if (pdfResult.success) {
          console.log(`PDF generated successfully: ${pdfResult.filename}`);
        } else {
          console.error("PDF generation failed:", pdfResult.error);
          alert(`Failed to generate PDF: ${pdfResult.error}`);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch report');
      }
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF report");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Parse city name from filename (handle multi-word cities)
  const parseCityFromFilename = (filename) => {
    // Remove .json extension
    const nameWithoutExt = filename.replace('.json', '');
    const parts = nameWithoutExt.split('-');
    
    // Format: cityname-YYYY-MM-DD-timestamp
    // We need to find where the date part starts (YYYY)
    if (parts.length >= 4) {
      // Find the year part (should be 4 digits starting with 20xx)
      let yearIndex = -1;
      for (let i = 0; i < parts.length; i++) {
        if (/^20\d{2}$/.test(parts[i])) {
          yearIndex = i;
          break;
        }
      }
      
      if (yearIndex > 0) {
        // Everything before the year is the city name
        const cityParts = parts.slice(0, yearIndex);
        return cityParts.join(' ').replace(/\b\w/g, l => l.toUpperCase()); // Title case
      }
    }
    
    return 'Unknown City';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen font-mont" style={{
        background: "linear-gradient(135deg, #1A4D47 0%, #2D5F5A 35%, #1A3A52 70%, #2D4A5F 100%)"
      }}>
        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-secondaryone/20 border-t-secondaryone"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-mont" style={{
      background: "linear-gradient(135deg, #1A4D47 0%, #2D5F5A 35%, #1A3A52 70%, #2D4A5F 100%)"
    }}>
      <div className="relative z-10 container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-secondaryone/20 text-textlight hover:bg-secondaryone/30 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Weather</span>
            </button>
            
            <button
              onClick={fetchReports}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-secondaryone/20 text-textlight hover:bg-secondaryone/30 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4" style={{
              background: "linear-gradient(135deg, #F9FAFB 0%, #A7CDC9 50%, #A7BECD 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              My Reports
            </h1>
            <p className="text-lg text-secondaryone">
              Your saved weather and news reports
            </p>
          </div>
        </div>

        {/* Storage Info */}
        {storageLocation && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="backdrop-blur-lg border border-secondaryone/15 bg-secondaryone/5 rounded-xl p-4">
              <div className="flex items-center justify-center space-x-3">
                {storageLocation.includes('S3') ? (
                  <Cloud className="w-5 h-5 text-secondaryone" />
                ) : (
                  <HardDrive className="w-5 h-5 text-secondaryone" />
                )}
                <span className="text-sm text-secondaryone">
                  {reports.length} reports stored in {storageLocation}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="backdrop-blur-lg border border-red-500/20 bg-red-500/10 rounded-xl p-6">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-textlight mb-2">
                    Failed to Load Reports
                  </h3>
                  <p className="text-red-400/80">{error}</p>
                  <button
                    onClick={fetchReports}
                    className="mt-3 px-4 py-2 bg-red-500/20 text-textlight rounded-lg hover:bg-red-500/30 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports List */}
        {!error && (
          <div className="max-w-4xl mx-auto">
            {reports.length === 0 ? (
              <div className="backdrop-blur-lg border border-secondaryone/15 bg-secondaryone/8 rounded-xl p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-secondaryone/50" />
                <h3 className="text-xl font-semibold text-textlight mb-2">
                  No Reports Yet
                </h3>
                <p className="text-secondaryone/70 mb-6">
                  Generate your first daily report to see it here
                </p>
                <button
                  onClick={onBack}
                  className="px-6 py-3 bg-secondaryone/20 text-textlight rounded-xl hover:bg-secondaryone/30 transition-colors"
                >
                  Go Generate Report
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report, index) => (
                  <div
                    key={report.filename}
                    onClick={() => handleReportClick(report.filename)}
                    className="backdrop-blur-lg border border-secondaryone/15 bg-secondaryone/8 rounded-xl p-6 hover:bg-secondaryone/12 hover:border-secondaryone/25 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="p-3 rounded-lg bg-secondaryone/20 group-hover:bg-secondaryone/30 transition-colors">
                          <FileText className="w-6 h-6 text-secondaryone" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <MapPin className="w-4 h-4 text-secondaryone/70" />
                            <h3 className="text-lg font-semibold text-textlight truncate">
                              {parseCityFromFilename(report.filename)}
                            </h3>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-secondaryone/70">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(report.created_at)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(report.created_at)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Download className="w-3 h-3" />
                              <span>{formatFileSize(report.size)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <div className="p-2 rounded-lg bg-primaryonelight/20 group-hover:bg-primaryonelight/30 transition-colors">
                          <Download className="w-5 h-5 text-primaryonelight" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Report Preview Info */}
                    <div className="mt-4 pt-4 border-t border-secondaryone/10">
                      <div className="text-xs text-secondaryone/60">
                        Click to generate PDF report with weather data and news headlines
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReportsPage;