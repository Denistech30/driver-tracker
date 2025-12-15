import { z } from 'zod';

// Transaction validation schema
export const TransactionSchema = z.object({
  id: z.string().min(1, 'Transaction ID is required'),
  type: z.enum(['revenue', 'expense'], {
    errorMap: () => ({ message: 'Type must be either revenue or expense' })
  }),
  amount: z.number().positive('Amount must be positive'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Invalid date format'),
  description: z.string().optional(),
  recurring: z.boolean().optional(),
  recurringFrequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  recurringEndDate: z.string().optional()
});

// Category validation schema
export const CategorySchema = z.object({
  id: z.string().min(1, 'Category ID is required'),
  name: z.string().min(1, 'Category name is required').max(50, 'Category name too long'),
  type: z.enum(['revenue', 'expense'], {
    errorMap: () => ({ message: 'Type must be either revenue or expense' })
  }),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional()
});

// Settings validation schema
export const SettingsSchema = z.object({
  currency: z.string().min(1, 'Currency is required').optional(),
  language: z.string().min(1, 'Language is required').optional(),
  theme: z.enum(['light', 'dark']).optional(),
  availableQuestions: z.array(z.string()).optional()
});

// Budget validation schema
export const BudgetSchema = z.object({
  id: z.string().min(1, 'Budget ID is required'),
  categoryName: z.string().min(1, 'Category name is required'),
  allocated: z.number().min(0, 'Budget amount must be non-negative'),
  spent: z.number().min(0, 'Spent amount must be non-negative').optional(),
  icon: z.string().optional(),
  color: z.string().optional()
});

// Backup data validation schema
export const BackupDataSchema = z.object({
  transactions: z.array(TransactionSchema),
  categories: z.array(CategorySchema),
  version: z.string(),
  timestamp: z.string().refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime());
  }, 'Invalid timestamp format')
});

// Savings goal validation schema
export const SavingsGoalSchema = z.object({
  id: z.string().min(1, 'Goal ID is required').optional(),
  name: z.string().min(1, 'Goal name is required').max(100, 'Goal name too long'),
  target: z.number().positive('Target amount must be positive'),
  current: z.number().min(0, 'Current amount must be non-negative'),
  deadline: z.string().refine((date) => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed > new Date();
  }, 'Deadline must be a valid future date'),
  icon: z.string().optional(),
  color: z.string().optional(),
  emoji: z.string().optional()
});

// Type exports
export type Transaction = z.infer<typeof TransactionSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type Budget = z.infer<typeof BudgetSchema>;
export type BackupData = z.infer<typeof BackupDataSchema>;
export type SavingsGoal = z.infer<typeof SavingsGoalSchema>;

// Validation helper functions
export const validateTransaction = (data: unknown): Transaction => {
  return TransactionSchema.parse(data);
};

export const validateCategory = (data: unknown): Category => {
  return CategorySchema.parse(data);
};

export const validateSettings = (data: unknown): Settings => {
  return SettingsSchema.parse(data);
};

export const validateBudget = (data: unknown): Budget => {
  return BudgetSchema.parse(data);
};

export const validateBackupData = (data: unknown): BackupData => {
  return BackupDataSchema.parse(data);
};

export const validateSavingsGoal = (data: unknown): SavingsGoal => {
  return SavingsGoalSchema.parse(data);
};

// Safe validation functions that return results instead of throwing
export const safeValidateTransaction = (data: unknown) => {
  return TransactionSchema.safeParse(data);
};

export const safeValidateCategory = (data: unknown) => {
  return CategorySchema.safeParse(data);
};

export const safeValidateBackupData = (data: unknown) => {
  return BackupDataSchema.safeParse(data);
};

export const safeValidateSavingsGoal = (data: unknown) => {
  return SavingsGoalSchema.safeParse(data);
};