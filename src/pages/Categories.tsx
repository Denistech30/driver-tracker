import { useState, FormEvent } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Edit, Trash2 } from 'lucide-react';
import { getCategories, addCategory, updateCategory, deleteCategory, Category } from '../lib/categories';
import { getTransactions } from '../lib/storage';

interface FormData {
  name: string;
  type: 'revenue' | 'expense' | '';
  color: string;
}

function Categories() {
  const [formData, setFormData] = useState<FormData>({ name: '', type: '', color: '#6b7280' });
  const [editId, setEditId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const categories = getCategories();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.type) newErrors.type = 'Type selection required';
    setErrors(newErrors as Partial<FormData>);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editId) {
      updateCategory(editId, formData.name, formData.type as 'revenue' | 'expense', formData.color);
      setEditId(null);
    } else {
      addCategory(formData.name, formData.type as 'revenue' | 'expense', formData.color);
    }

    setFormData({ name: '', type: '', color: '#6b7280' });
    setErrors({});
  };

  const handleEdit = (category: Category) => {
    setFormData({ 
      name: category.name, 
      type: category.type, 
      color: category.color || '#6b7280' 
    });
    setEditId(category.id);
  };

  const handleDelete = (id: string) => {
    // Prevent deletion if category is used in transactions
    const transactions = getTransactions();
    const isUsed = transactions.some((t) => t.category === categories.find((c) => c.id === id)?.name);
    if (isUsed) {
      setErrors({ name: 'Cannot delete category used in transactions' });
      return;
    }
    deleteCategory(id);
    setFormData({ name: '', type: '', color: '#6b7280' });
    setEditId(null);
  };

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Manage Categories</h2>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {editId ? 'Edit Category' : 'Add Category'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-muted-foreground">
                Category Name
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter category name"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <label htmlFor="type" className="text-sm font-medium text-muted-foreground">
                Type
              </label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value as 'revenue' | 'expense' }))}
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
              <label htmlFor="color" className="text-sm font-medium text-muted-foreground">
                Color
              </label>
              <div className="flex items-center gap-3">
                <div 
                  className="h-6 w-6 rounded-full border shadow-sm" 
                  style={{ backgroundColor: formData.color }}
                ></div>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                  className="h-9 w-full p-1"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {editId ? 'Update' : 'Add'}
              </Button>
              {editId && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setFormData({ name: '', type: '', color: '#6b7280' });
                    setEditId(null);
                    setErrors({});
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-3 card-grid-sm">
        {categories.length === 0 ? (
          <p className="text-gray-500 text-center">No categories found.</p>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="bg-card shadow-sm rounded-lg p-4 flex justify-between items-center border-l-4" style={{ borderLeftColor: category.color || '#6b7280' }}>
              <div className="flex items-center gap-3">
                <div 
                  className="h-8 w-8 rounded-full flex items-center justify-center text-white flex-shrink-0" 
                  style={{ backgroundColor: category.color || '#6b7280' }}
                >
                  <span className="text-xs font-bold">{category.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 text-truncate-sm">
                    {category.name}
                  </span>
                  <span className="text-xs text-muted-foreground block capitalize">
                    {category.type}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleEdit(category)}
                  aria-label={`Edit ${category.name}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(category.id)}
                  aria-label={`Delete ${category.name}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default Categories;