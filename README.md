# Driver Tracker App

A Progressive Web App (PWA) designed for drivers to track their expenses and income, manage financial data, and generate detailed reports, all with offline capabilities.

![Driver Tracker App Screenshot](screenshot.png)

## Features

- **Transaction Management**: Track expenses and income with detailed categorization
- **Financial Dashboard**: View summary statistics and visualizations of your financial data
- **Category Management**: Create, edit, and organize custom categories for expenses and revenue
- **Detailed Reports**: Generate comprehensive financial reports with daily performance metrics
- **PDF Export**: Export reports as professionally formatted PDF documents
- **Offline Support**: Full functionality without an internet connection
- **PIN Protection**: Secure your financial data with PIN protection
- **Responsive Design**: Works on mobile, tablet, and desktop devices
- **Dark Mode Support**: Comfortable viewing in any lighting conditions

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast building and development
- **Tailwind CSS** for styling
- **Chart.js** for data visualization
- **jsPDF and html2canvas** for PDF generation
- **PWA Support** via vite-plugin-pwa
- **Local Storage** for offline data persistence

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/driver-tracker.git

# Navigate to the project directory
cd driver-tracker

# Install dependencies
npm install

# Start development server
npm run dev
```

## Building for Production

```bash
# Create optimized production build
npm run build

# Preview the production build locally
npm run preview
```

## Deployment

This app is configured for easy deployment to platforms like Netlify or Vercel. The PWA configuration enables installation on mobile devices for a native-like experience.

## License

MIT
