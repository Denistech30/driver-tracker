import React from 'react';
import { Download } from 'lucide-react';
import { Button } from './ui/button';
import { exportToPDF } from '../utils/pdfExport';

interface PdfExportButtonProps {
  targetId: string;
  title: string;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

const PdfExportButton: React.FC<PdfExportButtonProps> = ({
  targetId,
  title,
  className = '',
  variant = 'outline'
}) => {
  const handleExport = async () => {
    try {
      await exportToPDF(targetId, title);
    } catch (error) {
      console.error('PDF export failed:', error);
    }
  };

  return (
    <Button
      variant={variant}
      size="sm"
      className={`flex items-center gap-1 ${className}`}
      onClick={handleExport}
    >
      <Download className="h-4 w-4" />
      <span>Export PDF</span>
    </Button>
  );
};

export default PdfExportButton;
