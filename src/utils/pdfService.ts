import { jsPDF } from 'jspdf';
// Import autoTable - this is the most critical part
import autoTable from 'jspdf-autotable';

/**
 * Custom PDF service that ensures autoTable is available
 */
export class PDFService {
  private doc: jsPDF;

  constructor(orientation?: 'p' | 'portrait' | 'l' | 'landscape', unit?: 'pt' | 'px' | 'in' | 'mm' | 'cm' | 'ex' | 'em' | 'pc', format?: string | [number, number]) {
    this.doc = new jsPDF(orientation, unit, format);
    // Manually attach autoTable to the doc if needed
    if (!this.doc.autoTable) {
      (this.doc as any).autoTable = autoTable;
    }
  }

  /**
   * Add text to the PDF
   */
  addText(text: string, x: number, y: number, options?: any): PDFService {
    this.doc.text(text, x, y, options);
    return this;
  }

  /**
   * Set font size
   */
  setFontSize(size: number): PDFService {
    this.doc.setFontSize(size);
    return this;
  }

  /**
   * Set text color
   */
  setTextColor(r: number, g?: number, b?: number): PDFService {
    this.doc.setTextColor(r, g || r, b || r);
    return this;
  }

  /**
   * Add a table to the PDF
   */
  addTable(options: any): PDFService {
    try {
      // Use direct import of autoTable
      autoTable(this.doc, options);
    } catch (error) {
      console.error('Error adding table:', error);
    }
    return this;
  }

  /**
   * Get page width
   */
  getPageWidth(): number {
    return this.doc.internal.pageSize.getWidth();
  }

  /**
   * Get page height
   */
  getPageHeight(): number {
    return this.doc.internal.pageSize.getHeight();
  }

  /**
   * Save the PDF with the given filename
   */
  save(filename: string): void {
    this.doc.save(filename);
  }
}

/**
 * Helper function to format currency
 */
export const formatCurrency = (amount: number, currencySymbol: string): string => {
  return `${currencySymbol} ${amount.toLocaleString('en-US')}`;
};

/**
 * Generate a financial report PDF
 */
export const generateFinancialReportPDF = async (
  reportType: 'summary' | 'daily',
  data: {
    monthName: string;
    summary: {
      revenue: number;
      expenses: number;
      netIncome: number;
    };
    categoryBreakdown: Array<{
      categoryType: string;
      type: string;
      amount: number;
      description: string;
    }>;
    dailyPerformance: Array<{
      date: string;
      revenue: number;
      expenses: number;
      net: number;
      status: string;
    }>;
  },
  fileName: string,
  currencySymbol: string
): Promise<void> => {
  // Create a new PDF service instance
  const pdfService = new PDFService();
  let yPos = 15; // Starting Y position

  // Format currency helper
  const formatCurr = (amount: number): string => formatCurrency(amount, currencySymbol);

  // --- Header ---
  pdfService.setFontSize(22)
    .addText(`Financial Report - ${data.monthName}`, pdfService.getPageWidth() / 2, yPos, { align: 'center' });
  
  yPos += 15;
  
  pdfService.setFontSize(10)
    .setTextColor(100)
    .addText(
      `Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      pdfService.getPageWidth() - 10, 
      yPos, 
      { align: 'right' }
    );
  
  yPos += 10;
  pdfService.setTextColor(0);

  // --- Content based on report type ---
  if (reportType === 'summary') {
    // Summary section
    pdfService.setFontSize(16)
      .addText('Summary', 14, yPos);
    
    yPos += 7;
    
    // Summary table
    pdfService.addTable({
      startY: yPos,
      head: [['Metric', 'Amount']],
      body: [
        ['Revenue', formatCurr(data.summary.revenue)],
        ['Expenses', formatCurr(data.summary.expenses)],
        [
          { content: 'Net Income', styles: { fontStyle: 'bold' } },
          {
            content: formatCurr(data.summary.netIncome),
            styles: {
              fontStyle: 'bold',
              textColor: data.summary.netIncome >= 0 ? [40, 167, 69] : [220, 53, 69]
            }
          }
        ],
      ],
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 11 },
      styles: { fontSize: 10, cellPadding: 3, valign: 'middle' },
      columnStyles: {
        1: { halign: 'right' },
      },
      margin: { left: 10, right: 10 },
    });
    
    // Fixed spacing for next section
    yPos += 80;
    
    // Category Breakdown
    pdfService.setFontSize(16)
      .addText('Category Breakdown', 14, yPos);
    
    yPos += 7;
    
    // Category table
    pdfService.addTable({
      startY: yPos,
      head: [['Category Type', 'Type', 'Amount', 'Description']],
      body: data.categoryBreakdown.map(item => [
        item.categoryType,
        item.type,
        formatCurr(item.amount),
        item.description,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 11 },
      styles: { fontSize: 10, cellPadding: 3, valign: 'middle' },
      columnStyles: {
        2: { halign: 'right' },
      },
      margin: { left: 10, right: 10 },
    });
    
  } else if (reportType === 'daily') {
    // Daily Performance section
    pdfService.setFontSize(16)
      .addText('Daily Performance', 14, yPos);
    
    yPos += 7;
    
    // Daily Performance table
    pdfService.addTable({
      startY: yPos,
      head: [['Date', 'Daily Revenue', 'Daily Expenses', 'Daily Net (P/L)', 'Status']],
      body: data.dailyPerformance.map(day => {
        const formattedDate = new Date(day.date).toLocaleDateString('en-US', 
          { month: 'short', day: 'numeric', year: 'numeric' });
        return [
          formattedDate,
          formatCurr(day.revenue),
          formatCurr(day.expenses),
          formatCurr(day.net),
          day.status,
        ];
      }),
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 11 },
      styles: { fontSize: 10, cellPadding: 3, valign: 'middle' },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
      },
      didParseCell: (data: any) => {
        if (data.section === 'body') {
          // Style for 'Net (P/L)' column
          if (data.column.index === 3) {
            const netValue = data.row.raw[3].replace(currencySymbol, '').trim();
            data.cell.styles.fontStyle = 'bold';
            if (parseFloat(netValue.replace(/,/g, '')) >= 0) {
              data.cell.styles.textColor = [40, 167, 69];
            } else {
              data.cell.styles.textColor = [220, 53, 69];
            }
          }
          // Style for 'Status' column
          if (data.column.index === 4) {
            const status = data.row.raw[4];
            if (status === 'Profit') {
              data.cell.styles.textColor = [40, 167, 69];
            } else if (status === 'Loss') {
              data.cell.styles.textColor = [220, 53, 69];
            } else if (status === 'Break-even') {
              data.cell.styles.textColor = [108, 117, 125];
            }
          }
        }
      },
      margin: { left: 10, right: 10 },
    });
  }

  // --- Footer ---
  pdfService.setFontSize(10)
    .setTextColor(150, 150, 150)
    .addText(
      'Driver Tracker App - Financial Report',
      pdfService.getPageWidth() / 2,
      pdfService.getPageHeight() - 10,
      { align: 'center' }
    );

  // Save the PDF
  pdfService.save(fileName);
};
