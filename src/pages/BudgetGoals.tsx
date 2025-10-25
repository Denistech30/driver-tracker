import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { 
  Target,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  Trophy,
  Flame,
  Star,
  Gift,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  PiggyBank,
  Sparkles,
  Award,
  Crown
} from 'lucide-react';
import { useBudgetEnhanced } from '../contexts/BudgetEnhancedContext';
import { useCategories } from '../hooks/useCategories';
import { useSettings } from '../contexts/SettingsContext';
import { getBudgetStatus } from '../lib/budgetEnhanced';
import { formatCurrency as formatCurrencyUtil } from '../lib/currencyUtils';
import { addCategory } from '../lib/categories';
import { SavingsGoal } from '../types/budget';

export default function BudgetGoalsPage() {
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newBudgetCategory, setNewBudgetCategory] = useState('');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [newBudgetIcon, setNewBudgetIcon] = useState('💰');
  const [newGoal, setNewGoal] = useState<Partial<SavingsGoal>>({
    name: '',
    target: 0,
    current: 0,
    deadline: '',
    icon: 'Target',
    color: 'bg-blue-500',
    emoji: '🎯'
  });

  const { 
    categoryBudgets, 
    savingsGoals, 
    achievements, 
    budgetStats,
    setCategoryBudget,
    addGoal,
    updateGoal,
    deleteGoal,
    getGoalProgress
  } = useBudgetEnhanced();
  
  const { categories } = useCategories();
  const { settings } = useSettings();

  // Format currency using the utility function
  const formatCurrency = (amount: number) => {
    return formatCurrencyUtil(amount, settings.currency || 'USD');
  };

  const handleAddBudget = () => {
    if (newBudgetCategory.trim() && newBudgetAmount) {
      const trimmedCategory = newBudgetCategory.trim();
      const amount = parseFloat(newBudgetAmount);
      
      if (amount <= 0) {
        alert('Please enter a valid budget amount greater than 0');
        return;
      }
      
      // Check if category already has a budget
      const existingBudget = categoryBudgets.find(b => b.categoryName.toLowerCase() === trimmedCategory.toLowerCase());
      if (existingBudget) {
        const confirmUpdate = confirm(`A budget for "${trimmedCategory}" already exists. Do you want to update it?`);
        if (!confirmUpdate) return;
      }
      
      const category = categories.find(c => c.name.toLowerCase() === trimmedCategory.toLowerCase());
      
      // If category doesn't exist, add it to the main categories list first
      let categoryId = category?.id || crypto.randomUUID();
      let categoryColor = category?.color || '#6366f1';
      
      if (!category) {
        addCategory(trimmedCategory, 'expense', categoryColor);
        console.log(`Added new category: ${trimmedCategory}`);
      }
      
      setCategoryBudget(
        categoryId,
        trimmedCategory,
        amount,
        newBudgetIcon,
        categoryColor
      );
      
      setNewBudgetCategory('');
      setNewBudgetAmount('');
      setNewBudgetIcon('💰');
      setShowAddBudget(false);
      
      // Show success message
      alert(`Budget created successfully for "${trimmedCategory}"! The category is now available for transactions.`);
    } else {
      alert('Please enter both category name and budget amount');
    }
  };

  const handleAddGoal = () => {
    if (newGoal.name && newGoal.target && newGoal.deadline) {
      addGoal({
        name: newGoal.name,
        target: newGoal.target,
        current: newGoal.current || 0,
        deadline: newGoal.deadline,
        icon: newGoal.icon || 'Target',
        color: newGoal.color || 'bg-blue-500',
        emoji: newGoal.emoji || '🎯'
      });
      setNewGoal({
        name: '',
        target: 0,
        current: 0,
        deadline: '',
        icon: 'Target',
        color: 'bg-blue-500',
        emoji: '🎯'
      });
      setShowAddGoal(false);
    }
  };

  const getAchievementIcon = (iconName: string) => {
    const icons = {
      Trophy,
      Flame,
      Star,
      Award,
      Crown,
      Target,
      PiggyBank
    };
    return icons[iconName as keyof typeof icons] || Trophy;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header with Stats */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 text-white shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 flex items-center gap-2">
                <Target className="h-6 w-6 sm:h-8 sm:w-8" />
                <span className="hidden xs:inline">Budget & Goals</span>
                <span className="xs:hidden">Budget</span>
              </h1>
              <p className="text-purple-100 text-sm sm:text-base">Track your progress, achieve your dreams</p>
            </div>
            
            <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full md:w-auto">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-300" />
                  <p className="text-lg sm:text-2xl font-bold">{budgetStats.streak}</p>
                </div>
                <p className="text-xs text-purple-100">Streak</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-300" />
                  <p className="text-lg sm:text-2xl font-bold">{achievements.filter(a => a.unlocked).length}</p>
                </div>
                <p className="text-xs text-purple-100">Badges</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <PiggyBank className="h-4 w-4 sm:h-5 sm:w-5 text-green-300" />
                  <p className="text-lg sm:text-2xl font-bold">{formatCurrency(budgetStats.totalSaved).replace(/[^0-9.k]/g, '')}</p>
                </div>
                <p className="text-xs text-purple-100">Saved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Overview Card */}
        <Card className="border-2 border-indigo-200">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-indigo-600" />
                Monthly Budget Overview
              </CardTitle>
              <Badge className={`${budgetStats.budgetHealth >= 10 ? 'bg-green-500' : budgetStats.budgetHealth >= 0 ? 'bg-orange-500' : 'bg-red-500'} text-white`}>
                {budgetStats.budgetHealth >= 0 
                  ? `${formatCurrency(budgetStats.totalBudget - budgetStats.totalSpent)} Remaining` 
                  : `${formatCurrency(Math.abs(budgetStats.totalBudget - budgetStats.totalSpent))} Over`
                }
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Budget</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(budgetStats.totalBudget)}</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Spent</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(budgetStats.totalSpent)}</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Budget Health</p>
                <p className={`text-lg sm:text-2xl font-bold ${budgetStats.budgetHealth >= 10 ? 'text-green-600' : budgetStats.budgetHealth >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                  {budgetStats.budgetHealth.toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            {budgetStats.totalBudget > 0 && (
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                  <span className="text-gray-600">Overall Progress</span>
                  <span className="font-semibold text-gray-900">
                    {((budgetStats.totalSpent / budgetStats.totalBudget) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${
                      (budgetStats.totalSpent / budgetStats.totalBudget) * 100 >= 100 ? 'bg-red-500' :
                      (budgetStats.totalSpent / budgetStats.totalBudget) * 100 >= 85 ? 'bg-orange-500' :
                      'bg-gradient-to-r from-green-400 to-green-600'
                    }`}
                    style={{ width: `${Math.min((budgetStats.totalSpent / budgetStats.totalBudget) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Category Budgets */}
            <div className="space-y-2 sm:space-y-3">
              {categoryBudgets.map((budget) => {
                const status = getBudgetStatus(budget);
                const percentage = budget.allocated > 0 ? (budget.spent / budget.allocated) * 100 : 0;
                return (
                  <div key={budget.id} className={`p-3 sm:p-4 rounded-lg border-2 ${status.borderColor} ${status.bgColor} transition-all hover:shadow-md`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <span className="text-xl sm:text-2xl flex-shrink-0">{budget.icon || '💰'}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{budget.categoryName}</p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {formatCurrency(budget.spent)} / {formatCurrency(budget.allocated)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <Badge className={`${status.color} bg-white text-xs px-1.5 py-0.5 sm:px-2 sm:py-1`}>
                          <span className="hidden sm:inline">{status.message}</span>
                          <span className="sm:hidden">{status.message.split(' ')[0]}</span>
                        </Badge>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="h-2 bg-white rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            percentage >= 100 ? 'bg-red-500' :
                            percentage >= 85 ? 'bg-orange-500' :
                            'bg-indigo-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <span className="absolute -top-1 right-0 text-xs font-semibold text-gray-700">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button onClick={() => setShowAddBudget(true)} className="w-full mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Add Custom Budget
            </Button>
          </CardContent>
        </Card>

        {/* Savings Goals */}
        <Card className="border-2 border-purple-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Target className="h-6 w-6 text-purple-600" />
              Savings Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {savingsGoals.map((goal) => {
                const { percentage, remaining, daysLeft } = getGoalProgress(goal);
                const isAlmostThere = percentage >= 95;
                const isHalfway = percentage >= 50;
                
                return (
                  <Card key={goal.id} className={`overflow-hidden border-2 transition-all hover:shadow-xl ${isAlmostThere ? 'border-yellow-400 animate-pulse' : 'border-gray-200'}`}>
                    <CardContent className="p-4 sm:p-6">
                      {isAlmostThere && (
                        <div className="flex items-center gap-2 mb-3 text-yellow-600">
                          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm font-semibold">Almost there! 🎉</span>
                        </div>
                      )}
                      
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className={`p-2 sm:p-3 ${goal.color} rounded-xl flex-shrink-0`}>
                            <span className="text-xl sm:text-2xl">{goal.emoji}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{goal.name}</h3>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {formatCurrency(remaining)} to go
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-0.5 sm:gap-1 flex-shrink-0">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => deleteGoal(goal.id)}>
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-bold text-gray-900">{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 sm:h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${goal.color} transition-all duration-1000`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                        <div>
                          <p className="text-gray-600 mb-1">Current</p>
                          <p className="font-semibold text-gray-900 text-sm sm:text-base">{formatCurrency(goal.current)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">Target</p>
                          <p className="font-semibold text-gray-900 text-sm sm:text-base">{formatCurrency(goal.target)}</p>
                        </div>
                      </div>

                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="truncate">{daysLeft > 0 ? `${daysLeft} days left` : 'Overdue'}</span>
                        </div>
                        <div className="flex-shrink-0">
                          {isHalfway && !isAlmostThere && (
                            <Badge className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5">
                              <span className="hidden sm:inline">Halfway! 🎯</span>
                              <span className="sm:hidden">50%! 🎯</span>
                            </Badge>
                          )}
                          {isAlmostThere && (
                            <Badge className="bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5">
                              <span className="hidden sm:inline">So close! ✨</span>
                              <span className="sm:hidden">95%! ✨</span>
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Button onClick={() => setShowAddGoal(true)} className="w-full mt-4 sm:mt-6 gap-2 bg-purple-600 hover:bg-purple-700 text-sm sm:text-base py-2 sm:py-3">
              <Plus className="h-4 w-4" />
              Add Savings Goal
            </Button>
          </CardContent>
        </Card>

        {/* Achievements & Gamification */}
        <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-600" />
              Your Achievements
            </CardTitle>
            <p className="text-sm text-gray-600">Keep going to unlock more badges!</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
              {achievements.map((achievement) => {
                const IconComponent = getAchievementIcon(achievement.icon);
                return (
                  <div
                    key={achievement.id}
                    className={`p-3 sm:p-4 rounded-xl text-center transition-all cursor-pointer ${
                      achievement.unlocked
                        ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-400 hover:scale-105'
                        : 'bg-gray-100 opacity-50 grayscale'
                    }`}
                  >
                    <IconComponent className={`h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 ${achievement.color}`} />
                    <p className="text-xs sm:text-sm font-semibold mb-1 leading-tight">{achievement.name}</p>
                    <p className="text-xs text-gray-600 leading-tight overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>{achievement.description}</p>
                    {achievement.unlocked && (
                      <Badge className="mt-2 bg-yellow-500 text-white text-xs px-1.5 py-0.5">
                        <CheckCircle2 className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                        <span className="hidden sm:inline">Unlocked</span>
                        <span className="sm:hidden">✓</span>
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Next Achievement Preview */}
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-gray-100 rounded-lg flex-shrink-0">
                  <Award className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">Next Achievement: Goal Crusher</p>
                  <p className="text-xs sm:text-sm text-gray-600">Complete 2 more goals to unlock this badge</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{savingsGoals.filter(g => g.current >= g.target).length}/5</p>
                  <p className="text-xs text-gray-500">Goals</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Budget Modal */}
      <Dialog open={showAddBudget} onOpenChange={setShowAddBudget}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Add Custom Budget Category</DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Create a budget for any category you want to track. You can use existing categories or create new ones.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category" className="text-sm font-medium">Category Name</Label>
              <Input
                id="category"
                type="text"
                value={newBudgetCategory}
                onChange={(e) => setNewBudgetCategory(e.target.value)}
                placeholder="Enter category name (e.g., Food, Transport, Entertainment)"
                className="mt-1 text-sm sm:text-base p-2 sm:p-3"
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                {categories.filter(c => c.type === 'expense').map(category => (
                  <option key={category.id} value={category.name} />
                ))}
              </datalist>
              <p className="text-xs text-gray-500 mt-1">
                Type a new category name or select from existing ones
              </p>
            </div>
            <div>
              <Label htmlFor="icon" className="text-sm font-medium">Category Icon</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {['💰', '🍔', '🚗', '🏠', '🎬', '👕', '⚡', '🎯', '📱', '🏥', '🎓', '✈️'].map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewBudgetIcon(icon)}
                    className={`p-2 text-lg border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      newBudgetIcon === icon ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select an icon for your category
              </p>
            </div>
            <div>
              <Label htmlFor="amount" className="text-sm font-medium">Budget Amount</Label>
              <Input
                id="amount"
                type="number"
                value={newBudgetAmount}
                onChange={(e) => setNewBudgetAmount(e.target.value)}
                placeholder="Enter budget amount"
                className="mt-1 text-sm sm:text-base p-2 sm:p-3"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAddBudget(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleAddBudget} className="w-full sm:w-auto">
              Add Budget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Goal Modal */}
      <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
        <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Add Savings Goal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="goalName" className="text-sm font-medium">Goal Name</Label>
              <Input
                id="goalName"
                value={newGoal.name || ''}
                onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                placeholder="e.g., Vacation Fund"
                className="mt-1 text-sm sm:text-base p-2 sm:p-3"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target" className="text-sm font-medium">Target Amount</Label>
                <Input
                  id="target"
                  type="number"
                  value={newGoal.target || ''}
                  onChange={(e) => setNewGoal({...newGoal, target: parseFloat(e.target.value) || 0})}
                  placeholder="Enter target amount"
                  className="mt-1 text-sm sm:text-base p-2 sm:p-3"
                />
              </div>
              <div>
                <Label htmlFor="current" className="text-sm font-medium">Current Amount</Label>
                <Input
                  id="current"
                  type="number"
                  value={newGoal.current || ''}
                  onChange={(e) => setNewGoal({...newGoal, current: parseFloat(e.target.value) || 0})}
                  placeholder="Enter current amount"
                  className="mt-1 text-sm sm:text-base p-2 sm:p-3"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="deadline" className="text-sm font-medium">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={newGoal.deadline || ''}
                onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                className="mt-1 text-sm sm:text-base p-2 sm:p-3"
              />
            </div>
            <div>
              <Label htmlFor="emoji" className="text-sm font-medium">Emoji</Label>
              <Input
                id="emoji"
                value={newGoal.emoji || ''}
                onChange={(e) => setNewGoal({...newGoal, emoji: e.target.value})}
                placeholder="🎯"
                maxLength={2}
                className="mt-1 text-sm sm:text-base p-2 sm:p-3 text-center"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAddGoal(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleAddGoal} className="w-full sm:w-auto">
              Add Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
