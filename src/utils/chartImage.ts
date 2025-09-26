import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

function createCanvas(width = 800, height = 450): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export async function generateRevenueExpensesBarImage(
  revenue: number,
  expenses: number,
  currency: string,
  locale: string = 'en-US'
): Promise<{ title: string; dataUrl: string; width: number; height: number } | null> {
  const canvas = createCanvas(700, 420);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const labels = ['Revenue', 'Expenses'];
  const data = [revenue, expenses];

  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Amount',
          data,
          backgroundColor: ['#10b981', '#ef4444'],
          borderColor: 'rgba(0,0,0,0.1)',
          borderWidth: 1,
        }
      ]
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => formatCurr(Number(ctx.raw), currency, locale)
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (val) => formatCurr(Number(val), currency, locale),
          }
        }
      }
    }
  };

  const chart = new Chart(ctx, config);
  chart.update();
  await new Promise(r => setTimeout(r, 150));
  const dataUrl = canvas.toDataURL('image/png');
  chart.destroy();
  return { title: 'Revenue vs Expenses', dataUrl, width: canvas.width, height: canvas.height };
}

function formatCurr(amount: number, currency: string, locale: string): string {
  const code = currency === 'FCFA' ? 'XAF' : currency;
  try {
    const out = new Intl.NumberFormat(locale || 'en-US', {
      style: 'currency',
      currency: code as any,
      currencyDisplay: 'code',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return currency === 'FCFA' ? out.replace('XAF', 'FCFA') : out;
  } catch {
    return `${currency} ${amount.toLocaleString(locale || 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export async function generateCategoryPieChartImage(
  categories: Array<{ name: string; amount: number; type: 'revenue' | 'expense' }>,
  currency: string,
  locale: string = 'en-US'
): Promise<{ title: string; dataUrl: string; width: number; height: number } | null> {
  if (!categories || categories.length === 0) return null;
  // Use a wider canvas to reduce label truncation
  const canvas = createCanvas(820, 520);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Sort by amount desc and aggregate into Top 12 + Other for clarity
  const sorted = [...categories].sort((a, b) => b.amount - a.amount);
  const top = sorted.slice(0, 12);
  const rest = sorted.slice(12);
  const otherSum = rest.reduce((acc, c) => acc + c.amount, 0);
  const display = otherSum > 0 ? [...top, { name: 'Other', amount: otherSum, type: 'expense' as const }] : top;

  const labels = display.map(c => c.name);
  const data = display.map(c => c.amount);

  const colors = [
    '#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#22c55e','#06b6d4','#f97316','#84cc16','#eab308','#a855f7'
  ];

  // Use a horizontal bar chart for more accurate, readable comparisons
  const config: ChartConfiguration<'bar'> = {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Amount',
        data,
        backgroundColor: labels.map((_, i) => colors[i % colors.length]),
        borderColor: 'rgba(0,0,0,0.1)',
        borderWidth: 1,
      }]
    },
    options: {
      indexAxis: 'y',
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const value = typeof ctx.raw === 'number' ? ctx.raw : 0;
              return formatCurr(value as number, currency, locale);
            }
          }
        },
        title: { display: false },
      },
      scales: {
        x: {
          ticks: {
            callback: (val) => formatCurr(Number(val), currency, locale),
          },
          grid: { display: true }
        },
        y: {
          grid: { display: false }
        }
      }
    }
  };

  const chart = new Chart(ctx, config);
  // Ensure chart renders before snapshot
  chart.update();
  await new Promise(r => setTimeout(r, 150));
  const dataUrl = canvas.toDataURL('image/png');
  chart.destroy();

  return { title: 'Category Breakdown (Top 12 + Other)', dataUrl, width: canvas.width, height: canvas.height };
}

export async function generateDailyNetLineChartImage(
  daily: Array<{ date: string; revenue: number; expenses: number; net: number }>,
  currency: string,
  locale: string = 'en-US'
): Promise<{ title: string; dataUrl: string; width: number; height: number } | null> {
  if (!daily || daily.length === 0) return null;
  const canvas = createCanvas(800, 420);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const labels = daily.map(d => new Date(d.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' }));
  const revenue = daily.map(d => d.revenue);
  const expenses = daily.map(d => d.expenses);
  const net = daily.map(d => d.net);

  const config: ChartConfiguration<'line'> = {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Revenue', data: revenue, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.2)', tension: 0.3 },
        { label: 'Expenses', data: expenses, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.2)', tension: 0.3 },
        { label: 'Net', data: net, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.2)', tension: 0.3 },
      ]
    },
    options: {
      responsive: false,
      animation: false,
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const label = ctx.dataset.label || '';
              const value = typeof ctx.raw === 'number' ? ctx.raw : 0;
              return `${label}: ${formatCurr(value as number, currency, locale)}`;
            }
          }
        },
      },
      scales: {
        y: {
          ticks: {
            callback: (val) => formatCurr(Number(val), currency, locale),
          }
        }
      }
    }
  };

  const chart = new Chart(ctx, config);
  chart.update();
  await new Promise(r => setTimeout(r, 150));
  const dataUrl = canvas.toDataURL('image/png');
  chart.destroy();

  return { title: 'Daily Performance (Revenue, Expenses, Net)', dataUrl, width: canvas.width, height: canvas.height };
}
