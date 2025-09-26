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
export const formatCurrency = (amount: number, currencyCodeOrLabel: string, locale: string = 'en-US'): string => {
  // Normalize FCFA to XAF for Intl, then replace back to FCFA label
  const code = currencyCodeOrLabel === 'FCFA' ? 'XAF' : currencyCodeOrLabel;
  try {
    const formatted = new Intl.NumberFormat(locale || 'en-US', {
      style: 'currency',
      currency: code as any,
      currencyDisplay: 'code',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return currencyCodeOrLabel === 'FCFA' ? formatted.replace('XAF', 'FCFA') : formatted;
  } catch {
    return `${currencyCodeOrLabel} ${amount.toLocaleString(locale || 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
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
    transactions?: Array<{
      date: string;
      type: 'revenue' | 'expense';
      category: string;
      amount: number;
      description?: string;
    }>;
  },
  fileName: string,
  currencySymbol: string,
  options?: {
    landscape?: boolean;
    includeCategoryPercent?: boolean;
    includeTransactionsAppendix?: boolean;
    locale?: string;
    charts?: Array<{ title: string; dataUrl: string; width?: number; height?: number }>;
    template?: 'classic' | 'modern';
  }
): Promise<void> => {
  // Create a new PDF service instance (landscape for daily report if requested)
  const wantLandscape = Boolean(options?.landscape) && reportType === 'daily';
  const pdfService = new PDFService(wantLandscape ? 'l' : 'p');
  let yPos = 15; // Starting Y position

  // Format currency helper
  const locale = options?.locale || 'en-US';
  const formatCurr = (amount: number): string => formatCurrency(amount, currencySymbol, locale);

  // Helper: load an image path into a data URL for jsPDF
  async function loadImageDataUrl(path: string): Promise<string | null> {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const dataUrl: string = await new Promise((resolve, reject) => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve('');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } catch (e) {
            resolve('');
          }
        };
        img.onerror = reject;
        img.src = path;
      });
      return dataUrl || null;
    } catch {
      return null;
    }
  }

  // --- Header ---
  pdfService.setFontSize(22)
    .addText(`Financial Report - ${data.monthName}`,
      pdfService.getPageWidth() / 2, yPos, { align: 'center' });
  
  yPos += 15;
  
  pdfService.setFontSize(10)
    .setTextColor(100)
    .addText(
      `Generated on: ${new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}`,
      pdfService.getPageWidth() - 10,
      yPos,
      { align: 'right' }
    );
  
  yPos += 10;
  pdfService.setTextColor(0);

  const isModern = options?.template === 'modern';

  // --- Header (modern vs classic) ---
  if (isModern) {
    // Colored header band
    const pageW = pdfService.getPageWidth();
    const pageH = pdfService.getPageHeight();
    const docAny: any = (pdfService as any);
    const innerDoc: jsPDF = (docAny.doc || (docAny.getDoc && docAny.getDoc())) || (docAny as any);
    innerDoc.setFillColor(44, 62, 80); // dark blue
    innerDoc.rect(0, 0, pageW, 32, 'F');
    // Try to draw app logo with rounded border, positioned left to avoid text overlap
    try {
      const logoUrl = await loadImageDataUrl('/pwa-192x192 (2).png');
      if (logoUrl) {
        const logoW = 12; // mm
        const logoH = 12; // mm
        const padding = 2; // mm around the image for the rounded frame
        const frameW = logoW + padding * 2;
        const frameH = logoH + padding * 2;
        const logoX = 10; // left margin
        const logoY = 6;  // slightly lower to balance band
        // Rounded white frame (gives rounded borders effect)
        innerDoc.setDrawColor(230);
        innerDoc.setFillColor(255, 255, 255);
        innerDoc.roundedRect(logoX - padding, logoY - padding, frameW, frameH, 3, 3, 'FD');
        // Draw the logo image inside the frame
        innerDoc.addImage(logoUrl, 'PNG', logoX, logoY, logoW, logoH, undefined, 'FAST');
      }
    } catch {}
    innerDoc.setTextColor(255);
    innerDoc.setFontSize(18);
    innerDoc.text('Financial Report', pageW / 2, 12, { align: 'center' });
    innerDoc.setFontSize(11);
    innerDoc.text(`${data.monthName}`, pageW / 2, 19, { align: 'center' });
    innerDoc.setFontSize(9);
    innerDoc.setTextColor(230);
    innerDoc.text(`Generated on: ${new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}`, pageW / 2, 26, { align: 'center' });
    // Reset
    pdfService.setTextColor(0);
    yPos = 38;

    // Summary cards (3 cards)
    const cardW = (pageW - 28) / 3; // margins 10, gaps 4
    const leftX = 10;
    const gap = 4;
    const cardH = 28;
    const metrics = [
      { label: 'Total Revenue', value: formatCurr(data.summary.revenue), color: [16, 185, 129] as [number, number, number] },
      { label: 'Total Expenses', value: formatCurr(data.summary.expenses), color: [239, 68, 68] as [number, number, number] },
      { label: 'Net Income', value: formatCurr(data.summary.netIncome), color: data.summary.netIncome >= 0 ? ([243, 156, 18] as [number, number, number]) : ([239, 68, 68] as [number, number, number]) },
    ];
    metrics.forEach((m, i) => {
      const x = leftX + i * (cardW + gap);
      innerDoc.setDrawColor(225);
      innerDoc.setFillColor(255, 255, 255);
      innerDoc.roundedRect(x, yPos, cardW, cardH, 2, 2, 'FD');
      // top bar
      innerDoc.setFillColor(...m.color);
      innerDoc.rect(x, yPos, cardW, 3, 'F');
      // text
      innerDoc.setTextColor(127, 140, 141);
      innerDoc.setFontSize(9);
      innerDoc.text(m.label, x + 4, yPos + 10);
      innerDoc.setTextColor(44, 62, 80);
      innerDoc.setFontSize(14);
      innerDoc.text(String(m.value), x + 4, yPos + 22);
    });
    yPos += cardH + 10;
  } else {
    // Classic header
    pdfService.setFontSize(22)
      .addText(`Financial Report - ${data.monthName}`,
        pdfService.getPageWidth() / 2, yPos, { align: 'center' });
    yPos += 15;
    pdfService.setFontSize(10)
      .setTextColor(100)
      .addText(
        `Generated on: ${new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' })}`,
        pdfService.getPageWidth() - 10,
        yPos,
        { align: 'right' }
      );
    yPos += 10;
    pdfService.setTextColor(0);
  }

  // --- Content based on report type ---
  if (reportType === 'summary') {
    // Summary section
    if (!isModern) {
      pdfService.setFontSize(16)
        .addText('Summary', 14, yPos);
      yPos += 7;
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
      yPos += 80;
    }
    
    // Category Breakdown
    pdfService.setFontSize(16)
      .addText('Category Breakdown', 14, yPos);
    
    yPos += 7;
    
    // Category table (optionally include % of total within type, and sort by amount desc)
    const catsSorted = [...data.categoryBreakdown].sort((a, b) => b.amount - a.amount);
    const totalByType: Record<string, number> = catsSorted.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + c.amount;
      return acc;
    }, {} as Record<string, number>);

    const includePct = Boolean(options?.includeCategoryPercent) || isModern; // modern always shows %
    const head = includePct
      ? [['Category Type', 'Type', 'Amount', '% of Type', 'Description']]
      : [['Category Type', 'Type', 'Amount', 'Description']];

    const body = catsSorted.map(item => {
      const pct = totalByType[item.type] ? ((item.amount / totalByType[item.type]) * 100) : 0;
      return includePct
        ? [item.categoryType, item.type, formatCurr(item.amount), `${pct.toFixed(1)}%`, item.description]
        : [item.categoryType, item.type, formatCurr(item.amount), item.description];
    });

    pdfService.addTable({
      startY: yPos,
      head,
      body,
      theme: isModern ? 'striped' : 'grid',
      headStyles: isModern ? { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold', fontSize: 11 } : { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 11 },
      styles: { fontSize: 10, cellPadding: 3, valign: 'middle' },
      columnStyles: includePct
        ? { 2: { halign: 'right' }, 3: { halign: 'right' } }
        : { 2: { halign: 'right' } },
      margin: { left: 10, right: 10 },
    });

    // Transactions Appendix (optional) — in modern template this is styled as a main table
    if ((options?.includeTransactionsAppendix || isModern) && data.transactions && data.transactions.length > 0) {
      // Advance below previous table
      yPos = (pdfService as any).doc?.lastAutoTable?.finalY ? (pdfService as any).doc.lastAutoTable.finalY + 12 : yPos + 60;

      pdfService.setFontSize(16).addText(isModern ? 'Transaction History' : 'Transactions (Appendix)', 14, yPos);
      yPos += 7;

      pdfService.addTable({
        startY: yPos,
        head: [['Date', 'Type', 'Category', 'Amount', 'Description']],
        body: data.transactions
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map(tx => [
            new Date(tx.date).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }),
            // badge-like label via surrounding brackets for PDF
            tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
            tx.category,
            formatCurr(tx.amount),
            tx.description || '-',
          ]),
        theme: 'striped',
        headStyles: isModern ? { fillColor: [44, 62, 80], textColor: 255, fontStyle: 'bold', fontSize: 11 } : { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold', fontSize: 11 },
        styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
        columnStyles: {
          3: { halign: 'right' },
        },
        margin: { left: 10, right: 10 },
      });
    }
    
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
        const formattedDate = new Date(day.date).toLocaleDateString(locale,
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

  // --- Optional Charts Section ---
  if (options?.charts && options.charts.length > 0) {
    // Advance Y position below last table if autoTable exposed it
    const docAny: any = (pdfService as any);
    const innerDoc: jsPDF = (docAny.doc || (docAny.getDoc && docAny.getDoc())) || (docAny as any);
    const lastFinalY = (docAny as any)?.doc?.lastAutoTable?.finalY;
    if (lastFinalY && typeof lastFinalY === 'number') {
      yPos = lastFinalY + 12;
    } else {
      yPos += 20;
    }

    for (const chart of options.charts) {
      // Add section title
      pdfService.setFontSize(16).addText(chart.title || 'Chart', 14, yPos);
      yPos += 7;

      const maxWidth = pdfService.getPageWidth() - 20; // left/right margins
      const desiredWidth = Math.min(chart.width || maxWidth, maxWidth);
      const aspect = (chart.height && chart.width) ? chart.height / chart.width : 9 / 16; // default 16:9
      const desiredHeight = desiredWidth * aspect;

      // Page break if the image would overflow
      if (yPos + desiredHeight + 10 > pdfService.getPageHeight()) {
        (innerDoc as jsPDF).addPage();
        yPos = 20;
      }

      try {
        // Center image horizontally
        const x = (pdfService.getPageWidth() - desiredWidth) / 2;
        (innerDoc as jsPDF).addImage(chart.dataUrl, 'PNG', x, yPos, desiredWidth, desiredHeight, undefined, 'FAST');
      } catch (e) {
        console.warn('Failed to add chart image to PDF:', e);
      }
      yPos += desiredHeight + 12;
    }
  }

  // --- Footer with page numbers ---
  const docAny: any = (pdfService as any);
  const doc = (docAny.doc || (docAny.getDoc && docAny.getDoc())) || (docAny as any);
  const totalPages = (doc as jsPDF).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    (doc as jsPDF).setPage(i);
    if (isModern) {
      // dark footer band
      (doc as jsPDF).setFillColor(44, 62, 80);
      (doc as jsPDF).rect(0, pdfService.getPageHeight() - 16, pdfService.getPageWidth(), 16, 'F');
      (doc as jsPDF).setTextColor(255);
      (doc as jsPDF).setFontSize(9);
      (doc as jsPDF).text(
        `Xpense Tracker App - Financial Report`,
        10,
        pdfService.getPageHeight() - 6
      );
      (doc as jsPDF).setTextColor(230);
      (doc as jsPDF).text(
        `Page ${i} of ${totalPages}`,
        pdfService.getPageWidth() - 10,
        pdfService.getPageHeight() - 6,
        { align: 'right' }
      );
    } else {
      pdfService.setFontSize(10)
        .setTextColor(150, 150, 150)
        .addText(
          `Xpense Tracker App - Financial Report | Page ${i} of ${totalPages}`,
          pdfService.getPageWidth() / 2,
          pdfService.getPageHeight() - 10,
          { align: 'center' }
        );
    }
  }

  // Save the PDF
  pdfService.save(fileName);
};
