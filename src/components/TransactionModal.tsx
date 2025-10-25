import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Transaction, getTransactions, deleteTransaction } from '../lib/storage';
import { useSettings } from '../contexts/SettingsContext';

interface TransactionModalProps {
  transaction: Transaction;
  onClose: () => void;
}

function TransactionModal({ transaction, onClose }: TransactionModalProps) {
  const { settings } = useSettings();

  const formatCurrency = (amount: number): string => {
    // Map FCFA to the correct ISO currency code (XAF - Central African CFA franc)
    const currencyCode = settings.currency === 'FCFA' ? 'XAF' : settings.currency;
    
    try {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        currencyDisplay: 'code'
      }).format(amount);
      
      // Replace XAF with FCFA if needed
      return settings.currency === 'FCFA' ? formatted.replace('XAF', 'FCFA') : formatted;
    } catch (error) {
      console.error('Error formatting currency:', error);
      // Fallback to basic formatting
      return `${settings.currency} ${amount.toFixed(2)}`;
    }
  };

  const formatDate = (dateStr: string): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  const handleDelete = () => {
    deleteTransaction(transaction.id);
    onClose();
  };

  return (
    <Dialog open={!!transaction} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 p-6">
          <div>
            <span className="text-sm font-medium text-muted-foreground">ID</span>
            <p className="text-sm text-gray-900">{transaction.id}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Type</span>
            <p className="text-sm text-gray-900 capitalize">{transaction.type}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Amount</span>
            <p className={`text-sm font-semibold ${transaction.type === 'revenue' ? 'revenue-text' : 'expense-text'}`}>
              {formatCurrency(transaction.amount)}
            </p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Category</span>
            <p className="text-sm text-gray-900">{transaction.category}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Date</span>
            <p className="text-sm text-gray-900">{formatDate(transaction.date)}</p>
          </div>
          {transaction.description && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">Description</span>
              <p className="text-sm text-gray-900">{transaction.description}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TransactionModal;