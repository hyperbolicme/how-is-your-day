import React, { useState } from "react";
import {
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Clock,
  Thermometer,
  Newspaper,
  ChartColumnBig,
} from "lucide-react";

// API base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

function ReportSection({ isLoading, currentCity }) {
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
    <div className="max-w-2xl mx-auto mb-8">
      <div
        className="backdrop-blur-lg border rounded-2xl p-6"
        style={{
          backgroundColor: "rgba(167, 205, 201, 0.08)",
          borderColor: "rgba(167, 205, 201, 0.15)",
        }}
      >
        {/* Report Generation Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5" style={{ color: "#A7CDC9" }} />
            <div>
              <h3
                className="text-lg font-semibold"
                style={{ color: "#F9FAFB" }}
              >
                Daily Report
              </h3>
              <p
                className="text-sm"
                style={{ color: "rgba(167, 205, 201, 0.7)" }}
              >
                Save weather & news data to your cloud storage
              </p>
            </div>
          </div>

          <button
            onClick={generateDailyReport}
            disabled={isGeneratingReport || isLoading}
            className={`
            flex items-center space-x-2 px-6 py-3 rounded-xl font-medium
            transition-all duration-200 transform hover:scale-105
            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
            ${isGeneratingReport ? "animate-pulse" : ""}
          `}
            style={{
              backgroundColor: isGeneratingReport
                ? "rgba(167, 205, 201, 0.15)"
                : "rgba(167, 205, 201, 0.2)",
              color: "#F9FAFB",
              boxShadow: isGeneratingReport
                ? "none"
                : "0 4px 12px rgba(167, 205, 201, 0.15)",
            }}
          >
            {isGeneratingReport ? (
              <>
                <div
                  className="animate-spin rounded-full h-4 w-4 border-2 border-t-2"
                  style={{
                    borderColor: "rgba(167, 205, 201, 0.3)",
                    borderTopColor: "#A7CDC9",
                  }}
                ></div>
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

        {/* Success Message */}
        {reportSuccess && (
          <div
            className="rounded-xl p-4 mb-4 border"
            style={{
              backgroundColor: "rgba(134, 187, 181, 0.1)",
              borderColor: "rgba(134, 187, 181, 0.2)",
            }}
          >
            <div className="flex items-start space-x-3">
              <CheckCircle
                className="w-5 h-5 mt-0.5 flex-shrink-0"
                style={{ color: "#86BBB5" }}
              />
              <div className="flex-1">
                <h4 className="font-medium mb-2" style={{ color: "#F9FAFB" }}>
                  Report Generated Successfully!
                </h4>

                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span style={{ color: "rgba(167, 205, 201, 0.7)" }}>
                        City:
                      </span>
                      <span
                        className="ml-2 font-medium"
                        style={{ color: "#F9FAFB" }}
                      >
                        {reportSuccess.city}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "rgba(167, 205, 201, 0.7)" }}>
                        Date:
                      </span>
                      <span
                        className="ml-2 font-medium"
                        style={{ color: "#F9FAFB" }}
                      >
                        {reportSuccess.date}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span style={{ color: "rgba(167, 205, 201, 0.7)" }}>
                        Size:
                      </span>
                      <span
                        className="ml-2 font-medium"
                        style={{ color: "#F9FAFB" }}
                      >
                        {reportSuccess.size} KB
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "rgba(167, 205, 201, 0.7)" }}>
                        Storage:
                      </span>
                      <span
                        className="ml-2 font-medium"
                        style={{ color: "#86BBB5" }}
                      >
                        {reportSuccess.storage.location}
                      </span>
                    </div>
                  </div>

                  {/* Report Preview */}
                  <div
                    className="mt-3 p-3 rounded-lg"
                    style={{ backgroundColor: "rgba(167, 205, 201, 0.05)" }}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span
                        className="text-sm font-medium"
                        style={{ color: "#A7CDC9" }}
                      >
                        Report Preview
                      </span>
                    </div>
                    <div className="text-xs space-y-1">
                      <div style={{ color: "#F9FAFB" }}>
                        <Thermometer
                          className="w-4 h-4"
                          style={{ color: "#A7CDC9" }}
                        />
                        <span
                          className="text-xs font-medium"
                          style={{ color: "#A7CDC9" }}
                        >
                          {reportSuccess.preview.current_temp} -{" "}
                          {reportSuccess.preview.weather_desc}
                        </span>
                      </div>
                      <div style={{ color: "rgba(167, 205, 201, 0.8)" }}>
                        <Newspaper
                          className="w-4 h-4"
                          style={{ color: "#A7CDC9" }}
                        />
                        <span
                          className="text-xs font-medium"
                          style={{ color: "#A7CDC9" }}
                        >
                          {reportSuccess.preview.top_headline ||
                            "Latest news included"}
                        </span>
                      </div>
                      <div style={{ color: "rgba(167, 205, 201, 0.6)" }}>
                        <ChartColumnBig
                          className="w-4 h-4"
                          style={{ color: "#A7CDC9" }}
                        />
                        <span
                          className="text-xs font-medium"
                          style={{ color: "#A7CDC9" }}
                        >
                          {reportSuccess.preview.forecast_items} forecasts,{" "}
                          {reportSuccess.preview.news_items} news items{" "}
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
          <div
            className="rounded-xl p-4 mb-4 border"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              borderColor: "rgba(239, 68, 68, 0.2)",
            }}
          >
            <div className="flex items-center space-x-3">
              <AlertCircle
                className="w-5 h-5 flex-shrink-0"
                style={{ color: "#EF4444" }}
              />
              <div>
                <h4 className="font-medium" style={{ color: "#F9FAFB" }}>
                  Report Generation Failed
                </h4>
                <p
                  className="text-sm mt-1"
                  style={{ color: "rgba(239, 68, 68, 0.8)" }}
                >
                  {reportError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Text */}
        {!reportSuccess && !reportError && (
          <div className="text-center">
            <p
              className="text-xs"
              style={{ color: "rgba(167, 205, 201, 0.6)" }}
            >
              Creates a comprehensive JSON report with current weather, 5-day
              forecast, and latest news for <strong>{currentCity}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportSection;
