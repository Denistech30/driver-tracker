import React, { useState, useEffect } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/dialog';
import { useTranslation } from '../hooks/useTranslation';

interface BudgetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BudgetSettingsModal: React.FC<BudgetSettingsModalProps> = ({ isOpen, onClose }) => {
  const { budget, setBudget } = useBudget();
  const [newBudget, setNewBudget] = useState(budget?.toString() ?? '');
  const { t } = useTranslation();

  useEffect(() => {
    setNewBudget(budget?.toString() ?? '');
  }, [budget, isOpen]);

  const handleSave = () => {
    const budgetValue = parseFloat(newBudget);
    if (!isNaN(budgetValue) && budgetValue >= 0) {
      setBudget(budgetValue);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('modal.setMonthlyBudgetTitle')}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300 col-span-1 text-right">{t('form.budgetAmountLabel')}</label>
            <Input
              id="budget"
              type="number"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              className="col-span-3"
              placeholder={t('form.enterBudgetPlaceholder')}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>{t('common.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetSettingsModal;
