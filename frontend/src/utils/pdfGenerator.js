import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateReportPDF = (reportData, filename) => {
  try {
    // Create new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Helper function to add text with word wrapping
    const addWrappedText = (text, x, y, maxWidth, fontSize = 10) => {
      doc.setFontSize(fontSize);
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + (lines.length * fontSize * 0.35); // Return new Y position
    };

    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Weather & News Report', 20, yPosition);
    
    yPosition += 15;
    
    // Report metadata
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`City: ${reportData.metadata.city}`, 20, yPosition);
    doc.text(`Date: ${new Date(reportData.metadata.generated_at).toLocaleDateString()}`, 120, yPosition);
    
    yPosition += 10;
    doc.text(`Generated: ${new Date(reportData.metadata.generated_at).toLocaleString()}`, 20, yPosition);
    
    yPosition += 20;

    // Weather Section
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Current Weather', 20, yPosition);
    yPosition += 10;

    // Current weather data
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    const weather = reportData.weather.current;
    
    doc.text(`Temperature: ${weather.temperature}°C (Feels like ${weather.feels_like}°C)`, 20, yPosition);
    yPosition += 6;
    doc.text(`Conditions: ${weather.description}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Humidity: ${weather.humidity}% | Wind: ${weather.wind_speed} m/s`, 20, yPosition);
    yPosition += 6;
    doc.text(`Pressure: ${weather.pressure} hPa`, 20, yPosition);
    
    yPosition += 15;

    // Forecast section
    if (reportData.weather.forecast && reportData.weather.forecast.length > 0) {
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Weather Forecast', 20, yPosition);
      yPosition += 10;

      // Create simple forecast table manually
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      
      // Table headers
      doc.text('Date', 20, yPosition);
      doc.text('Time', 50, yPosition);
      doc.text('Temp', 80, yPosition);
      doc.text('Conditions', 100, yPosition);
      doc.text('Humidity', 150, yPosition);
      
      yPosition += 8;
      
      // Draw header line
      doc.line(20, yPosition - 2, 180, yPosition - 2);
      
      doc.setFont(undefined, 'normal');
      
      // Forecast data rows
      reportData.weather.forecast.slice(0, 6).forEach((item) => {
        const date = new Date(item.datetime);
        doc.text(date.toLocaleDateString(), 20, yPosition);
        doc.text(date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 50, yPosition);
        doc.text(`${item.temperature}°C`, 80, yPosition);
        doc.text(item.description.substring(0, 20), 100, yPosition); // Truncate long descriptions
        doc.text(`${item.humidity}%`, 150, yPosition);
        yPosition += 6;
      });

      yPosition += 10;
    }

    // News section
    if (reportData.news.headlines && reportData.news.headlines.length > 0) {
      // Check if we need a new page
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Top News Headlines', 20, yPosition);
      yPosition += 10;

      reportData.news.headlines.forEach((article, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        // Article number and title
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        yPosition = addWrappedText(`${index + 1}. ${article.title}`, 20, yPosition, pageWidth - 40, 11);
        yPosition += 2;

        // Article description
        if (article.description) {
          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);
          yPosition = addWrappedText(article.description, 25, yPosition, pageWidth - 50, 9);
        }

        // Source and publication date
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const sourceText = `Source: ${article.source} | Published: ${new Date(article.published_at).toLocaleDateString()}`;
        yPosition = addWrappedText(sourceText, 25, yPosition + 2, pageWidth - 50, 8);
        
        // URL (if available)
        if (article.url) {
          doc.setTextColor(0, 0, 255);
          yPosition = addWrappedText(`URL: ${article.url}`, 25, yPosition + 2, pageWidth - 50, 8);
        }

        doc.setTextColor(0, 0, 0); // Reset color
        yPosition += 8;
      });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generated by Weather App | Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    const pdfFilename = filename.replace('.json', '.pdf');
    doc.save(pdfFilename);
    
    return { success: true, filename: pdfFilename };

  } catch (error) {
    console.error('Error generating PDF:', error);
    return { success: false, error: error.message };
  }
};