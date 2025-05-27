import { useState, FormEvent, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Mic, Square } from 'lucide-react';
import { addTransaction } from '../lib/storage';
import { getCategories, Category } from '../lib/categories';
import { useSettings } from '../contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';

interface FormData {
  type: 'revenue' | 'expense' | '';
  amount: string;
  category: string;
  date: string;
  description: string;
}

function AddTransaction() {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    type: '',
    amount: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [voiceError, setVoiceError] = useState('');

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

    addTransaction({
      type: formData.type as 'revenue' | 'expense',
      amount: Number(formData.amount),
      category: formData.category,
      date: formData.date,
      description: formData.description || undefined,
    });

    navigate('/transactions');
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

  const categories: Category[] = getCategories();
  const filteredCategories = formData.type
    ? categories.filter((c) => c.type === formData.type)
    : [];

  return (
    <section className="flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Add Transaction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium text-muted-foreground">
                Type
              </label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, type: value as 'revenue' | 'expense', category: '' }))
                }
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium text-muted-foreground">
                Amount ({settings.currency})
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500">
                    {settings.currency === 'USD' ? '$' : 
                     settings.currency === 'EUR' ? '€' : 
                     settings.currency === 'GBP' ? '£' : 
                     settings.currency === 'FCFA' ? 'FCFA' : ''}
                  </span>
                </div>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1000000"
                  value={formData.amount}
                  onChange={(e) => {
                    // Remove non-numeric characters except decimal point
                    const value = e.target.value.replace(/[^0-9.]/g, '');
                    // Ensure only one decimal point
                    const parts = value.split('.');
                    const formatted = parts.length > 1 
                      ? `${parts[0]}.${parts.slice(1).join('')}` 
                      : value;
                    setFormData((prev) => ({ ...prev, amount: formatted }));
                  }}
                  onBlur={() => {
                    // Format to 2 decimal places on blur if there's a value
                    if (formData.amount && !isNaN(Number(formData.amount))) {
                      setFormData((prev) => ({
                        ...prev,
                        amount: Number(prev.amount).toFixed(2)
                      }));
                    }
                  }}
                  className={settings.currency === 'FCFA' ? 'pl-16' : 'pl-8'}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="category" className="text-sm font-medium text-muted-foreground">
                Category
              </label>
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
            <Button type="submit" className="w-full">
              Save Transaction
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}

export default AddTransaction;