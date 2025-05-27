// Import jsPDF dynamically to ensure proper initialization with autoTable plugin
import { jsPDF } from 'jspdf';

// Import and initialize autoTable - This ensures the plugin is properly loaded
import 'jspdf-autotable';

// Type definition for the autoTable plugin
interface AutoTableOptions {
  startY?: number;
  head?: any[][];
  body?: any[][];
  theme?: string;
  headStyles?: Record<string, any>;
  styles?: Record<string, any>;
  columnStyles?: Record<string, any>;
  margin?: Record<string, any>;
  didParseCell?: (data: any) => void;
}

// Ensure the autoTable method is available on jsPDF instances
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF;
  }
}

// Interfaces for the data types that will be passed from Reports.tsx
interface SummaryData {
  revenue: number;
  expenses: number;
  netIncome: number;
}

interface CategoryDetail {
  categoryType: string;
  type: 'Revenue' | 'Expense'; // Type will be capitalized for display
  amount: number;
  description: string;
}

interface DailyFinancial {
  date: string; // 'YYYY-MM-DD'
  revenue: number;
  expenses: number;
  net: number;
  status: 'Profit' | 'Loss' | 'Break-even';
}

// Consolidated interface for all report data
interface FinancialReportPdfData {
  monthName: string;
  summary: SummaryData;
  categoryBreakdown: CategoryDetail[];
  dailyPerformance: DailyFinancial[];
}

/**
 * Generates a financial report PDF (Summary & Categories or Daily Performance).
 * This function directly creates tables in the PDF using jspdf-autotable,
 * offering better styling, text searchability, and smaller file sizes compared to HTML-to-image conversion.
 *
 * @param reportType - The type of report to generate ('summary' or 'daily').
 * @param data - The financial data to include in the report.
 * @param fileName - The desired name for the generated PDF file.
 * @param currencySymbol - The currency symbol to use (e.g., 'FCFA').
 */
export async function generateFinancialReportPDF(
  reportType: 'summary' | 'daily',
  data: FinancialReportPdfData,
  fileName: string,
  currencySymbol: string
) {
  const doc = new jsPDF();
  let yPos = 15; // Starting Y position for content on the PDF

  // Helper to format currency consistently
  const formatCurrency = (amount: number): string => {
    return `${currencySymbol} ${amount.toLocaleString('en-US')}`;
  };

  // --- Header ---
  doc.setFontSize(22);
  doc.text(`Financial Report - ${data.monthName}`, doc.internal.pageSize.width / 2, yPos, { align: 'center' });
  yPos += 15; // Move down for next element

  doc.setFontSize(10);
  doc.setTextColor(100); // Grey color for meta-info
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, doc.internal.pageSize.width - 10, yPos, { align: 'right' });
  yPos += 10;

  // Reset text color for main content
  doc.setTextColor(0);

  // --- Conditional Table Generation based on reportType ---
  if (reportType === 'summary') {
    // Summary Table
    doc.setFontSize(16);
    doc.text('Summary', 14, yPos); // Title for this section
    yPos += 7; // Space after title

    doc.autoTable({
      startY: yPos,
      head: [['Metric', 'Amount']],
      body: [
        ['Revenue', formatCurrency(data.summary.revenue)],
        ['Expenses', formatCurrency(data.summary.expenses)],
        [
          { content: 'Net Income', styles: { fontStyle: 'bold' } }, // Apply bold style directly to Net Income row's cell
          {
            content: formatCurrency(data.summary.netIncome),
            styles: {
              fontStyle: 'bold',
              textColor: data.summary.netIncome >= 0 ? [40, 167, 69] : [220, 53, 69] // Green for profit, Red for loss
            }
          }
        ],
      ],
      theme: 'striped', // Clean, alternating row colors
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 11 }, // Blue header
      styles: { fontSize: 10, cellPadding: 3, valign: 'middle' }, // General cell styling
      columnStyles: {
        1: { halign: 'right' }, // Align 'Amount' column to the right
      },
      margin: { left: 10, right: 10 }, // Add some horizontal margin
    });

    // Use a fixed increment instead of relying on previous.finalY
    yPos += 100; // Add enough space after the summary table

    // Category Breakdown Table
    doc.setFontSize(16);
    doc.text('Category Breakdown', 14, yPos); // Title for this section
    yPos += 7; // Space after title

    doc.autoTable({
      startY: yPos,
      head: [['Category Type', 'Type', 'Amount', 'Description']],
      body: data.categoryBreakdown.map(item => [
        item.categoryType,
        item.type,
        formatCurrency(item.amount),
        item.description,
      ]),
      theme: 'grid', // 'grid' theme for full borders, clear separation
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 11 },
      styles: { fontSize: 10, cellPadding: 3, valign: 'middle' },
      columnStyles: {
        2: { halign: 'right' }, // Align 'Amount' column to the right
      },
      margin: { left: 10, right: 10 },
    });

  } else if (reportType === 'daily') {
    // Daily Performance Table
    doc.setFontSize(16);
    doc.text('Daily Performance', 14, yPos); // Title for this section
    yPos += 7; // Space after title

    doc.autoTable({
      startY: yPos,
      head: [['Date', 'Daily Revenue', 'Daily Expenses', 'Daily Net (P/L)', 'Status']],
      body: data.dailyPerformance.map(day => {
        // Format date for display in the PDF
        const formattedDate = new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return [
          formattedDate,
          formatCurrency(day.revenue),
          formatCurrency(day.expenses),
          formatCurrency(day.net),
          day.status,
        ];
      }),
      theme: 'striped', // Alternating row colors
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 11 },
      styles: { fontSize: 10, cellPadding: 3, valign: 'middle' },
      columnStyles: {
        1: { halign: 'right' }, // Revenue
        2: { halign: 'right' }, // Expenses
        3: { halign: 'right' }, // Net
      },
      // Use didParseCell hook for conditional styling of 'Net' and 'Status' columns
      didParseCell: (hookData) => {
        if (hookData.section === 'body') {
          // Style for 'Net (P/L)' column (index 3)
          if (hookData.column.index === 3) {
            const netValue = data.dailyPerformance[hookData.row.index].net;
            hookData.cell.styles.fontStyle = 'bold'; // Make net bold
            if (netValue >= 0) {
              hookData.cell.styles.textColor = [40, 167, 69]; // Green for profit/break-even
            } else {
              hookData.cell.styles.textColor = [220, 53, 69]; // Red for loss
            }
          }
          // Style for 'Status' column (index 4)
          if (hookData.column.index === 4) {
            const status = data.dailyPerformance[hookData.row.index].status;
            if (status === 'Profit') {
              hookData.cell.styles.textColor = [40, 167, 69]; // Green
            } else if (status === 'Loss') {
              hookData.cell.styles.textColor = [220, 53, 69]; // Red
            } else if (status === 'Break-even') {
              hookData.cell.styles.textColor = [108, 117, 125]; // Grey
            }
          }
        }
      },
      margin: { left: 10, right: 10 },
    });
  }

  // --- Footer ---
  // Position footer at the bottom of the page
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  const footerText = 'Driver Tracker App - Financial Report';
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.text(
    footerText,
    doc.internal.pageSize.getWidth() / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Save the PDF
  doc.save(fileName);
}

// Export a PDF version of the current report
export const exportToPDF = async (reportId: string, title: string): Promise<void> => {
  // Format filename with date
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = `${title.toLowerCase().replace(/\s+/g, '_')}_${date}.pdf`;
  
  try {
    await generateFinancialReportPDF('summary', {
      monthName: title,
      summary: { revenue: 0, expenses: 0, netIncome: 0 },
      categoryBreakdown: [],
      dailyPerformance: []
    }, filename, 'FCFA');
    console.log(`PDF exported successfully: ${filename}`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    alert('Failed to export PDF. Please try again.');
  }
};
