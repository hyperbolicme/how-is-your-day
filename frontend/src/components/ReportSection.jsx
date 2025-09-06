import React, { useState } from "react";
import {
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Thermometer,
  Newspaper,
  ChartColumnBig,
} from "lucide-react";

// API base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function ReportSection({ isLoading, currentCity, country, onViewReports }) {
  // Report generation states
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(null);
  const [reportError, setReportError] = useState(null);

  const generateDailyReport = async () => {
    if (!currentCity) {
      setReportError("Please select a city first");
      return;
    }

    setIsGeneratingReport(true);
    setReportError(null);
    setReportSuccess(null);

    try {
      console.log(`🚀 Generating report for ${currentCity}...`);

      const response = await fetch(`${API_BASE_URL}/api/generate-report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          city: currentCity,
          country: country
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.success) {
        setReportSuccess({
          filename: data.report.filename,
          city: data.report.city,
          date: data.report.date,
          size: Math.round(data.report.size_bytes / 1024), // Convert to KB
          preview: data.preview,
          storage: data.report.storage,
        });

        console.log("✅ Report generated successfully:", data);

        // Auto-hide success message after 10 seconds
        setTimeout(() => {
          setReportSuccess(null);
        }, 10000);
      } else {
        throw new Error(data.error || "Failed to generate report");
      }
    } catch (error) {
      console.error("❌ Error generating report:", error);
      setReportError(error.message || "Failed to generate report");

      // Auto-hide error message after 8 seconds
      setTimeout(() => {
        setReportError(null);
      }, 8000);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="backdrop-blur-lg border border-secondaryone/15 bg-secondaryone/10 rounded-2xl p-6">
        {/* Report Generation Section Header and Buttons */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FileText className="w-10 h-10 text-secondaryone" />
            <div>
              <h3 className="text-lg font-semibold text-textlight">
                Daily Report
              </h3>
              <p className="text-sm text-secondaryone/70">
                Save weather & news data to your cloud storage
              </p>
            </div>
          </div>

          {/* Button Group */}
          <div className="flex items-center space-x-3">
            {/* My Reports Button */}
            <button
              onClick={onViewReports}
              className="
                flex items-center space-x-2 px-4 py-2 rounded-xl font-medium 
                transition-all duration-200 transform hover:scale-105 
                bg-primaryonelight/20 text-textlight hover:bg-primaryonelight/30"
            >
              <FileText className="w-4 h-4" />
              <span>My Reports</span>
            </button>

            {/* Generate Report Button */}
            <button
              onClick={generateDailyReport}
              disabled={isGeneratingReport || isLoading}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-xl font-medium
                transition-all duration-200 transform hover:scale-105
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                text-textlight  hover:bg-primaryonelight/30
                ${isGeneratingReport 
                  ? "animate-pulse bg-secondaryone/15 shadow-none" 
                  : "bg-secondaryone/20 shadow-secondaryone/15"
                }
              `}
            >
              {isGeneratingReport ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-secondaryone/30 border-t-secondaryone"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Generate Report</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Message */}
        {reportSuccess && (
          <div className="rounded-xl p-4 mb-4 border border-primaryonelight/20 bg-primaryonelight/10">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-primaryonelight" />
              <div className="flex-1">
                <h4 className="font-medium mb-2 text-textlight">
                  Report Generated Successfully!
                </h4>

                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-secondaryone/70">City:</span>
                      <span className="ml-2 font-medium text-textlight">
                        {reportSuccess.city}
                      </span>
                    </div>
                    <div>
                      <span className="text-secondaryone/70">Date:</span>
                      <span className="ml-2 font-medium text-textlight">
                        {reportSuccess.date}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-secondaryone/70">Size:</span>
                      <span className="ml-2 font-medium text-textlight">
                        {reportSuccess.size} KB
                      </span>
                    </div>
                    <div>
                      <span className="text-secondaryone/70">Storage:</span>
                      <span className="ml-2 font-medium text-primaryonelight">
                        {reportSuccess.storage.location}
                      </span>
                    </div>
                  </div>

                  {/* Report Preview */}
                  <div className="mt-3 p-3 rounded-lg bg-secondaryone/5">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-secondaryone">
                        Report Preview
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div className="flex items-center space-x-2">
                        <Thermometer className="w-4 h-4 text-secondaryone" />
                        <span className="text-xs font-medium text-secondaryone">
                          {reportSuccess.preview.current_temp} -{" "}
                          {reportSuccess.preview.weather_desc}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Newspaper className="w-4 h-4 text-secondaryone" />
                        <span className="text-xs font-medium text-secondaryone">
                          {reportSuccess.preview.top_headline ||
                            "Latest news included"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ChartColumnBig className="w-4 h-4 text-secondaryone" />
                        <span className="text-xs font-medium text-secondaryone">
                          {reportSuccess.preview.forecast_items} forecasts,{" "}
                          {reportSuccess.preview.news_items} news items
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {reportError && (
          <div className="rounded-xl p-4 mb-4 border border-red-500/20 bg-red-500/10">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
              <div>
                <h4 className="font-medium text-textlight">
                  Report Generation Failed
                </h4>
                <p className="text-sm mt-1 text-red-400/80">
                  {reportError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Text */}
        {!reportSuccess && !reportError && (
          <div className="text-center">
            <p className="text-xs text-secondaryone/60">
              Creates a comprehensive JSON report with current weather, 5-day
              forecast, and latest news for <strong className="text-textlight">{currentCity}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportSection;