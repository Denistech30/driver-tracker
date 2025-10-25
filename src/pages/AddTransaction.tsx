import { useState, FormEvent, useEffect, useMemo, useRef } from 'react';
import Tesseract from 'tesseract.js';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Mic, Square, Plus, Zap, Check, Clock, Repeat, DollarSign, TrendingDown, TrendingUp, Calendar, CalendarDays, CalendarRange, Camera, Undo2, Sparkles } from 'lucide-react';
import { addTransaction, getTransactionById, updateTransaction, deleteTransaction } from '../lib/storage';
import { Category } from '../lib/categories';
import { useCategories } from '../hooks/useCategories';
import { useTransactions } from '../hooks/useTransactions';
import { useSettings } from '../contexts/SettingsContext';
import { useNavigate, useParams } from 'react-router-dom';

interface FormData {
  type: 'revenue' | 'expense' | '';
  amount: string;
  category: string;
  date: string;
  description: string;
  recurring: boolean;
  recurringFrequency: 'daily' | 'weekly' | 'monthly';
  recurringEndDate: string;
}

function AddTransaction() {
  const { transactionId } = useParams<{ transactionId?: string }>();
  const isEditMode = Boolean(transactionId);
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { categories } = useCategories();
  const { transactions } = useTransactions();
  const [viewMode, setViewMode] = useState<'quick' | 'full'>('quick');
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    type: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    recurring: false,
    recurringFrequency: 'monthly',
    recurringEndDate: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [voiceError, setVoiceError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.lang = settings.language;
      rec.continuous = false;
      rec.interimResults = false;
      rec.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setFormData((prev) => ({ ...prev, description: transcript }));
        setIsRecording(false);
      };
      rec.onerror = () => {
        setVoiceError('Voice recognition failed. Please try again.');
        setIsRecording(false);
      };
      setRecognition(rec);
    } else {
      setVoiceError('Voice recognition is not supported in this browser.');
    }
  }, [settings.language]);

  useEffect(() => {
    if (isEditMode && transactionId) {
      const existingTransaction = getTransactionById(transactionId);
      if (existingTransaction) {
        setFormData({
          type: existingTransaction.type,
          amount: existingTransaction.amount.toString(),
          category: existingTransaction.category,
          date: existingTransaction.date,
          description: existingTransaction.description || '',
          recurring: existingTransaction.recurring || false,
          recurringFrequency: existingTransaction.recurringFrequency || 'monthly',
          recurringEndDate: existingTransaction.recurringEndDate || '',
        });
      } else {
        console.error('Transaction not found for editing:', transactionId);
        navigate('/transactions'); 
      }
    }
    // Reset form if not in edit mode (e.g., navigating from edit to add directly)
    // Or if navigating away and back to add new.
    if (!isEditMode) {
      setFormData({
        type: '',
        amount: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        recurring: false,
        recurringFrequency: 'monthly',
        recurringEndDate: '',
      });
    }
  }, [isEditMode, transactionId, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    // Validate transaction type
    if (!formData.type) {
      newErrors.type = '' as 'revenue' | 'expense' | '';
    }

    // Validate amount with more specific error messages
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(Number(formData.amount))) {
      newErrors.amount = 'Amount must be a valid number';
    } else if (Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than zero';
    } else if (Number(formData.amount) > 1000000) {
      newErrors.amount = 'Amount cannot exceed 1,000,000';
    }

    // Validate category
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    // Validate date
    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else {
      // Check if date is in the future
      const selectedDate = new Date(formData.date);
      const currentDate = new Date();
      if (selectedDate > currentDate) {
        newErrors.date = 'Date cannot be in the future';
      }
    }

    // Validate description length if provided
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const id = crypto.randomUUID();
    const transactionData = {
      type: formData.type as 'revenue' | 'expense',
      amount: Number(formData.amount),
      category: formData.category,
      date: formData.date,
      description: formData.description || undefined,
      recurring: formData.recurring || undefined,
      recurringFrequency: formData.recurring ? formData.recurringFrequency : undefined,
      recurringEndDate: formData.recurring && formData.recurringEndDate ? formData.recurringEndDate : undefined,
    };

    if (isEditMode && transactionId) {
      updateTransaction({ ...transactionData, id: transactionId });
      navigate('/transactions');
    } else {
      addTransaction(transactionData);
      setLastTransactionId(id);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setLastTransactionId(null);
        setFormData({
          type: '',
          amount: '',
          category: '',
          date: new Date().toISOString().split('T')[0],
          description: '',
          recurring: false,
          recurringFrequency: 'monthly',
          recurringEndDate: '',
        });
        if (viewMode === 'full') {
          navigate('/transactions');
        }
      }, 5000);
    }
  };

  const handleQuickAdd = () => {
    if (!formData.amount || !formData.category || !formData.type) return;
    
    const id = crypto.randomUUID();
    const transactionData = {
      type: formData.type as 'revenue' | 'expense',
      amount: Number(formData.amount),
      category: formData.category,
      date: formData.date,
      description: formData.description || undefined,
    };

    addTransaction(transactionData);
    setLastTransactionId(id);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setLastTransactionId(null);
      setFormData(prev => ({
        ...prev,
        amount: '',
        category: '',
        description: '',
      }));
    }, 5000);
  };

  const handleUndo = () => {
    if (lastTransactionId) {
      deleteTransaction(lastTransactionId);
      setShowSuccess(false);
      setLastTransactionId(null);
    }
  };

  const handleRepeatTransaction = (transaction: any) => {
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category: transaction.category,
      date: new Date().toISOString().split('T')[0],
      description: transaction.description || '',
      recurring: false,
      recurringFrequency: 'monthly',
      recurringEndDate: '',
    });
    setViewMode('full');
  };

  const handleVoiceToggle = () => {
    if (!recognition) return;
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
      setVoiceError('');
    }
  };

  const parseReceiptText = (text: string) => {
    // Extract amount - look for currency symbols and numbers
    const amountPatterns = [
      /(?:total|amount|sum)[:\s]*[$€£]?\s*(\d+[.,]\d{2})/i,
      /[$€£]\s*(\d+[.,]\d{2})/,
      /(\d+[.,]\d{2})\s*[$€£]/,
      /total[:\s]*(\d+[.,]\d{2})/i,
    ];
    
    let extractedAmount = '';
    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match) {
        extractedAmount = match[1].replace(',', '.');
        break;
      }
    }

    // Extract date - look for common date formats
    const datePatterns = [
      /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/,
      /(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/,
    ];
    
    let extractedDate = '';
    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        // Try to parse and format as YYYY-MM-DD
        try {
          const [, p1, p2, p3] = match;
          let year, month, day;
          
          if (p1.length === 4) {
            // YYYY-MM-DD format
            year = p1;
            month = p2.padStart(2, '0');
            day = p3.padStart(2, '0');
          } else if (p3.length === 4) {
            // DD-MM-YYYY or MM-DD-YYYY format
            year = p3;
            month = p1.padStart(2, '0');
            day = p2.padStart(2, '0');
          } else {
            // Assume current century
            year = '20' + p3;
            month = p1.padStart(2, '0');
            day = p2.padStart(2, '0');
          }
          
          extractedDate = `${year}-${month}-${day}`;
          break;
        } catch (e) {
          console.error('Date parsing error:', e);
        }
      }
    }

    // Extract merchant/description - usually at the top of receipt
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const extractedDescription = lines.slice(0, 2).join(' ').trim().substring(0, 100);

    return {
      amount: extractedAmount,
      date: extractedDate,
      description: extractedDescription,
    };
  };

  const handleReceiptScan = async (file: File) => {
    if (!file) return;

    setIsScanning(true);
    setScanProgress(0);

    try {
      // Map app language to Tesseract language codes
      // Support multiple languages for better accuracy
      const languageMap: Record<string, string> = {
        'en': 'eng',
        'en-US': 'eng',
        'fr': 'fra',
        'fr-FR': 'fra',
        'es': 'spa',
        'es-ES': 'spa',
        'de': 'deu',
        'de-DE': 'deu',
        'it': 'ita',
        'pt': 'por',
        'ar': 'ara',
        'zh': 'chi_sim',
        'ja': 'jpn',
        'ko': 'kor',
      };

      // Get primary language and add English as fallback for better number recognition
      const primaryLang = languageMap[settings.language] || 'eng';
      const languages = primaryLang === 'eng' ? 'eng' : `${primaryLang}+eng`;

      const result = await Tesseract.recognize(file, languages, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setScanProgress(Math.round(m.progress * 100));
          }
        },
      });

      const extractedText = result.data.text;
      const parsed = parseReceiptText(extractedText);

      // Auto-fill form with extracted data
      setFormData(prev => ({
        ...prev,
        amount: parsed.amount || prev.amount,
        date: parsed.date || prev.date,
        description: parsed.description || prev.description,
      }));

      setIsScanning(false);
      setScanProgress(0);
    } catch (error) {
      console.error('Receipt scanning error:', error);
      alert('Failed to scan receipt. Please try again or enter details manually.');
      setIsScanning(false);
      setScanProgress(0);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleReceiptScan(file);
    }
  };

  const filteredCategories = formData.type
    ? categories.filter((c) => c.type === formData.type)
    : [];

  // Get top 5 most used categories for quick mode
  const topCategories = useMemo(() => {
    if (!formData.type) return [];
    const categoryCount: Record<string, number> = {};
    transactions
      .filter(t => t.type === formData.type)
      .forEach(t => {
        categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
      });
    const sorted = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
    return filteredCategories.filter(c => sorted.includes(c.name)).slice(0, 5);
  }, [formData.type, transactions, filteredCategories]);

  // Get recent transactions for repeat
  const recentTransactions = useMemo(() => {
    const now = new Date();
    return transactions
      .filter(t => {
        const txDate = new Date(t.date);
        const daysDiff = (now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7; // Last 7 days
      })
      .slice(0, 5);
  }, [transactions]);

  // Force full mode for edit
  useEffect(() => {
    if (isEditMode) {
      setViewMode('full');
    }
  }, [isEditMode]);

  // Calculate smart amount suggestion for selected category
  const suggestedAmount = useMemo(() => {
    if (!formData.category || !formData.type) return null;
    const categoryTransactions = transactions.filter(
      t => t.category === formData.category && t.type === formData.type
    );
    if (categoryTransactions.length === 0) return null;
    const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
    const average = total / categoryTransactions.length;
    return Math.round(average * 100) / 100;
  }, [formData.category, formData.type, transactions]);

  return (
    <section className="space-y-4">
      {/* Success Toast with Undo */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
          <div className="text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4" style={{ background: 'linear-gradient(to right, #2B6CB0, #4A90E2)' }}>
            <Check className="h-5 w-5" />
            <span className="font-medium">Transaction added!</span>
            {lastTransactionId && (
              <button
                onClick={handleUndo}
                className="ml-2 px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors flex items-center gap-1 text-sm font-semibold"
              >
                <Undo2 className="h-4 w-4" />
                Undo
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mode Toggle - Hide in edit mode */}
      {!isEditMode && (
        <div className="flex gap-3 justify-center p-1 bg-gray-100 dark:bg-gray-800 rounded-xl max-w-md mx-auto">
          <button
            onClick={() => setViewMode('quick')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              viewMode === 'quick' 
                ? 'text-white shadow-lg transform scale-105' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
            style={viewMode === 'quick' ? { background: 'linear-gradient(135deg, #2B6CB0, #4A90E2)' } : {}}
          >
            <Zap className="h-4 w-4" />
            <span>Quick</span>
          </button>
          <button
            onClick={() => setViewMode('full')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              viewMode === 'full' 
                ? 'text-white shadow-lg transform scale-105' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
            style={viewMode === 'full' ? { background: 'linear-gradient(135deg, #2B6CB0, #4A90E2)' } : {}}
          >
            <Plus className="h-4 w-4" />
            <span>Detailed</span>
          </button>
        </div>
      )}

      {viewMode === 'quick' && !isEditMode ? (
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Quick Add Interface */}
          <Card className="overflow-hidden shadow-xl border-0">
            <div className="p-6 sm:p-8 space-y-6">
              {/* Type Selection */}
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">Transaction Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'expense', category: '' }))}
                    className={`relative p-4 rounded-2xl border-2 transition-all duration-200 ${
                      formData.type === 'expense'
                        ? 'border-red-400 shadow-lg transform scale-105'
                        : 'border-gray-200 dark:border-gray-700 hover:border-red-300'
                    }`}
                    style={formData.type === 'expense' ? { background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)' } : {}}
                  >
                    <div className={`text-center ${formData.type === 'expense' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      <TrendingDown className="h-8 w-8 mx-auto mb-2" />
                      <div className="font-semibold">Expense</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'revenue', category: '' }))}
                    className={`relative p-4 rounded-2xl border-2 transition-all duration-200 ${
                      formData.type === 'revenue'
                        ? 'border-green-400 shadow-lg transform scale-105'
                        : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                    }`}
                    style={formData.type === 'revenue' ? { background: 'linear-gradient(135deg, #3CB371 0%, #5FD68A 100%)' } : {}}
                  >
                    <div className={`text-center ${formData.type === 'revenue' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                      <div className="font-semibold">Revenue</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">Amount</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl font-bold">
                    {settings.currency === 'USD' ? '$' : 
                     settings.currency === 'EUR' ? '€' : 
                     settings.currency === 'GBP' ? '£' : 
                     settings.currency === 'FCFA' ? 'FCFA' : settings.currency}
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="text-3xl font-bold h-20 pl-16 pr-4 rounded-2xl border-2 focus:border-blue-400 transition-all"
                    disabled={!formData.type}
                    style={{ borderColor: formData.amount ? '#4A90E2' : undefined }}
                  />
                </div>
                {suggestedAmount && !formData.amount && (
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, amount: suggestedAmount.toString() }))}
                    className="mt-2 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Suggested: {settings.currency} {suggestedAmount.toFixed(2)}</span>
                  </button>
                )}
              </div>

              {/* Category Pills */}
              {formData.type && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                    {topCategories.length > 0 ? 'Quick Categories' : 'Select Category'}
                  </label>
                  {topCategories.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {topCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setFormData(prev => ({ ...prev, category: cat.name }))}
                          className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                            formData.category === cat.name
                              ? 'border-blue-400 shadow-lg transform scale-105'
                              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                          }`}
                          style={formData.category === cat.name ? { 
                            background: 'linear-gradient(135deg, #2B6CB0 0%, #4A90E2 100%)',
                            color: 'white'
                          } : {}}
                        >
                          <div className="text-center">
                            <div className="font-semibold text-sm">{cat.name}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No categories yet. Switch to Detailed mode to select or create categories.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setViewMode('full')}
                  className="flex-1 h-14 rounded-xl border-2 hover:border-blue-400 transition-all"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  More Options
                </Button>
                <Button
                  disabled={!formData.amount || !formData.category || !formData.type}
                  onClick={handleQuickAdd}
                  className="flex-1 h-14 rounded-xl shadow-lg hover:shadow-xl transition-all"
                  style={{ background: 'linear-gradient(135deg, #2B6CB0 0%, #4A90E2 100%)', color: 'white' }}
                >
                  <Check className="h-5 w-5 mr-2" />
                  Save Transaction
                </Button>
              </div>
            </div>
          </Card>

          {/* Recent Transactions Repeat */}
          {recentTransactions.length > 0 && (
            <Card className="shadow-xl border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-gray-800 dark:text-gray-200">
                  <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #2B6CB0 0%, #4A90E2 100%)' }}>
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  Quick Repeat
                </CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tap to repeat a recent transaction</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentTransactions.map((transaction) => (
                  <button
                    key={transaction.id}
                    onClick={() => handleRepeatTransaction(transaction)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="text-left flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ 
                        background: transaction.type === 'expense' 
                          ? 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)' 
                          : 'linear-gradient(135deg, #3CB371 0%, #5FD68A 100%)'
                      }}>
                        {transaction.type === 'expense' ? (
                          <TrendingDown className="h-5 w-5 text-white" />
                        ) : (
                          <TrendingUp className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800 dark:text-gray-200">{transaction.category}</div>
                        <div className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-800 dark:text-gray-200">{settings.currency} {transaction.amount.toFixed(2)}</span>
                      <Repeat className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Full Form Mode */
        <Card className="w-full max-w-2xl mx-auto shadow-xl border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #2B6CB0 0%, #4A90E2 100%)' }}>
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{isEditMode ? 'Edit Transaction' : 'Add Transaction'}</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Fill in the details below</p>
                </div>
              </div>
              {!isEditMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode('quick')}
                  className="gap-2 rounded-lg"
                >
                  <Zap className="h-4 w-4" />
                  Quick
                </Button>
              )}
            </div>
          </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Transaction Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: 'expense', category: '' }))}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.type === 'expense'
                      ? 'border-red-400 shadow-lg transform scale-105'
                      : 'border-gray-200 dark:border-gray-700 hover:border-red-300'
                  }`}
                  style={formData.type === 'expense' ? { background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 100%)' } : {}}
                >
                  <div className={`text-center ${formData.type === 'expense' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    <TrendingDown className="h-8 w-8 mx-auto mb-2" />
                    <div className="font-semibold">Expense</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: 'revenue', category: '' }))}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.type === 'revenue'
                      ? 'border-green-400 shadow-lg transform scale-105'
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                  }`}
                  style={formData.type === 'revenue' ? { background: 'linear-gradient(135deg, #3CB371 0%, #5FD68A 100%)' } : {}}
                >
                  <div className={`text-center ${formData.type === 'revenue' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                    <div className="font-semibold">Revenue</div>
                  </div>
                </button>
              </div>
              {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
            </div>
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-bold">
                  {settings.currency === 'USD' ? '$' : 
                   settings.currency === 'EUR' ? '€' : 
                   settings.currency === 'GBP' ? '£' : 
                   settings.currency === 'FCFA' ? 'FCFA' : settings.currency}
                </div>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1000000"
                  value={formData.amount}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    const parts = value.split('.');
                    const formatted = parts.length > 1 
                      ? `${parts[0]}.${parts.slice(1).join('')}` 
                      : value;
                    setFormData((prev) => ({ ...prev, amount: formatted }));
                  }}
                  onBlur={() => {
                    if (formData.amount && !isNaN(Number(formData.amount))) {
                      setFormData((prev) => ({
                        ...prev,
                        amount: Number(prev.amount).toFixed(2)
                      }));
                    }
                  }}
                  className={`text-2xl font-bold h-16 rounded-xl border-2 focus:border-blue-400 transition-all ${settings.currency === 'FCFA' ? 'pl-20' : 'pl-14'} pr-4`}
                  placeholder="0.00"
                  style={{ borderColor: formData.amount ? '#4A90E2' : undefined }}
                />
              </div>
              {suggestedAmount && !formData.amount && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, amount: suggestedAmount.toString() }))}
                  className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Suggested: {settings.currency} {suggestedAmount.toFixed(2)}</span>
                </button>
              )}
              {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium text-muted-foreground">
                Category
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                    disabled={!formData.type}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/categories')}
                  className="p-2 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Add or manage categories"
                  title="Add or manage categories"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="date" className="text-sm font-medium text-muted-foreground">
                Date
              </label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
              />
              {/* Date shortcuts */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, date: new Date().toISOString().split('T')[0] }))
                  }
                >
                  Today
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 1);
                    const y = d.toISOString().split('T')[0];
                    setFormData((prev) => ({ ...prev, date: y }));
                  }}
                >
                  Yesterday
                </Button>
              </div>
              {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-muted-foreground">
                Description (Optional)
              </label>
              <div className="relative">
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter description"
                  rows={4}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleVoiceToggle}
                  disabled={!recognition}
                  aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                >
                  {isRecording ? <Square className="h-4 w-4 text-red-500" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
              {voiceError && <p className="text-sm text-destructive">{voiceError}</p>}
            </div>

            {/* Receipt Scanning */}
            <div className="rounded-xl p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isScanning}
                className="w-full flex items-center justify-center gap-3 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors disabled:opacity-50"
              >
                <Camera className="h-5 w-5" />
                <div className="text-left flex-1">
                  <div className="font-semibold text-sm">
                    {isScanning ? `Scanning... ${scanProgress}%` : 'Scan Receipt'}
                  </div>
                  <div className="text-xs opacity-75">
                    {isScanning ? 'Processing image with OCR' : 'Auto-fill from receipt photo'}
                  </div>
                </div>
              </button>
              {isScanning && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${scanProgress}%`,
                        background: 'linear-gradient(to right, #2B6CB0, #4A90E2)'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Recurring Transaction Section */}
            <div className="rounded-xl p-5 border-2 transition-all duration-200" style={{ 
              borderColor: formData.recurring ? '#4A90E2' : '#e5e7eb',
              backgroundColor: formData.recurring ? 'rgba(74, 144, 226, 0.08)' : 'transparent'
            }}>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={formData.recurring}
                  onChange={(e) => setFormData(prev => ({ ...prev, recurring: e.target.checked }))}
                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="recurring" className="flex-1 font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-5 w-5" style={{ color: '#4A90E2' }} />
                    Make this recurring
                  </div>
                </label>
              </div>
              
              {formData.recurring && (
                <div className="mt-4 space-y-4 pl-8 border-l-2 border-blue-300">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Frequency</label>
                    <Select
                      value={formData.recurringFrequency}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        recurringFrequency: value as 'daily' | 'weekly' | 'monthly'
                      }))}
                    >
                      <SelectTrigger className="h-11 rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Daily</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="weekly">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            <span>Weekly</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="monthly">
                          <div className="flex items-center gap-2">
                            <CalendarRange className="h-4 w-4" />
                            <span>Monthly</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">End Date (Optional)</label>
                    <Input
                      type="date"
                      value={formData.recurringEndDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurringEndDate: e.target.value }))}
                      min={formData.date}
                      className="h-11 rounded-lg"
                    />
                    <p className="text-xs text-gray-500">Leave empty for indefinite recurring</p>
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full h-14 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #2B6CB0 0%, #4A90E2 100%)', color: 'white' }}>
              <Check className="h-5 w-5" />
              {isEditMode ? 'Update Transaction' : 'Save Transaction'}
            </Button>
          </form>
        </CardContent>
      </Card>
      )}
    </section>
  );
}

export default AddTransaction;