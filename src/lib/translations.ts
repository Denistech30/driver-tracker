// Define translation types for type safety
export type TranslationKey = 
  | 'common.add'
  | 'common.edit'
  | 'common.delete'
  | 'common.cancel'
  | 'common.save'
  | 'common.loading'
  | 'common.currency'
  | 'common.language'
  | 'common.theme'
  | 'common.categories'
  | 'common.settings'
  | 'common.ok'
  | 'common.yes'
  | 'common.no'
  | 'common.error'
  | 'common.success'
  
  // Navigation
  | 'nav.overview'
  | 'nav.transactions'
  | 'nav.add'
  | 'nav.reports'
  | 'nav.calendar'
  | 'nav.categories'
  | 'nav.settings'
  
  // Settings
  | 'settings.title'
  | 'settings.preferences'
  | 'settings.security'
  | 'settings.backup'
  | 'settings.export'
  | 'settings.import'
  | 'settings.reset'
  | 'settings.resetConfirm'
  | 'settings.importSuccess'
  | 'settings.importError'
  
  // PIN Security
  | 'pin.setup'
  | 'pin.change'
  | 'pin.disable'
  | 'pin.unlock'
  | 'pin.enter'
  | 'pin.confirm'
  | 'pin.recovery'
  | 'pin.recoveryEmail'
  | 'pin.recoveryEmailInfo'
  | 'pin.recoveryCode'
  | 'pin.recoveryCodeInfo'
  | 'pin.securityQuestion'
  | 'pin.securityAnswer'
  | 'pin.recoverySuccess'
  | 'pin.recoveryFailed'
  | 'pin.internet'
  | 'pin.internetRequired'
  | 'pin.locked'
  | 'pin.tryAgain'
  | 'pin.forgotPin'
  | 'pin.recoveryPrompt'
  | 'pin.incorrectPin'
  | 'pin.noMatch'
  | 'pin.resetSuccess'
  | 'pin.changed'
  | 'pin.resetError'
  | 'pin.changeError'
  
  // Categories
  | 'categories.title'
  | 'categories.addNew'
  | 'categories.editCategory'
  | 'categories.name'
  | 'categories.type'
  | 'categories.color'
  | 'categories.revenue'
  | 'categories.expense'
  | 'categories.noCategories'
  | 'categories.deleteConfirm'
  | 'categories.deleteError'
  
  // Transactions
  | 'transactions.title'
  | 'transactions.addNew'
  | 'transactions.amount'
  | 'transactions.category'
  | 'transactions.date'
  | 'transactions.description'
  | 'transactions.type'
  | 'transactions.noTransactions'

  // Overview Page
  | 'overview.budgetAnalysisTitle'
  | 'overview.setBudgetButton'
  | 'overview.revenue'
  | 'overview.expenses'
  | 'overview.netIncome'
  | 'overview.expenseSummaryTitle'
  | 'overview.financialSummaryTitle'
  | 'overview.toggleFinancialOverview'
  | 'overview.toggleExpenseCategories'
  | 'overview.toggleBarChart'
  | 'overview.togglePieChart'
  | 'overview.noData'
  | 'overview.category'
  | 'overview.percentage'
  | 'overview.totalExpenses'
  | 'overview.financialEntryType'
  | 'overview.totalRevenueDescription'
  | 'overview.totalExpensesDescription'
  | 'overview.netIncomeDescription'
  | 'overview.noDataDescription'
  | 'overview.amountLabel'
  | 'overview.subtitle'
  | 'overview.setBudgetPrompt'
  // Budget Modal
  | 'modal.setMonthlyBudgetTitle'
  | 'form.budgetAmountLabel'
  | 'form.enterBudgetPlaceholder';

// Define the translation structure
export interface Translations {
  [key: string]: {
    [key in TranslationKey]: string;
  };
}

// Define available languages
export const languages = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'es-ES', label: 'Español' },
  { value: 'fr-FR', label: 'Français' },
];

// Create translations
export const translations: Translations = {
  'en-US': {
    // Common
    'common.add': 'Add',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.loading': 'Loading...',
    'common.currency': 'Currency',
    'common.language': 'Language',
    'common.theme': 'Theme',
    'common.categories': 'Categories',
    'common.settings': 'Settings',
    'common.ok': 'OK',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.error': 'Error',
    'common.success': 'Success',
    
    // Navigation
    'nav.overview': 'Overview',
    'nav.transactions': 'Transactions',
    'nav.add': 'Add',
    'nav.reports': 'Reports',
    'nav.calendar': 'Calendar',
    'nav.categories': 'Categories',
    'nav.settings': 'Settings',
    
    // Settings
    'settings.title': 'Settings',
    'settings.preferences': 'Preferences',
    'settings.security': 'Security',
    'settings.backup': 'Backup & Restore',
    'settings.export': 'Export Data',
    'settings.import': 'Import Data',
    'settings.reset': 'Reset App',
    'settings.resetConfirm': 'Are you sure you want to reset the app? This will delete all your data.',
    'settings.importSuccess': 'Data imported successfully',
    'settings.importError': 'Failed to import data',
    
    // PIN Security
    'pin.setup': 'Set Up PIN',
    'pin.change': 'Change PIN',
    'pin.disable': 'Disable PIN',
    'pin.unlock': 'Enter PIN',
    'pin.enter': 'Enter your PIN',
    'pin.confirm': 'Confirm PIN',
    'pin.recovery': 'Account Recovery',
    'pin.recoveryEmail': 'Recovery Email',
    'pin.recoveryEmailInfo': 'This email will be used to send a recovery code if you forget your PIN. Ensure this is a valid email address you have access to.',
    'pin.recoveryCode': 'Recovery Code',
    'pin.recoveryCodeInfo': 'Enter the recovery code sent to your email. The code is valid for 15 minutes.',
    'pin.securityQuestion': 'Security Question',
    'pin.securityAnswer': 'Security Answer',
    'pin.recoverySuccess': 'Recovery successful! Please set a new PIN.',
    'pin.recoveryFailed': 'Recovery failed. Please try again.',
    'pin.internet': 'Internet Connection',
    'pin.internetRequired': 'Internet connection is required to send recovery email.',
    'pin.locked': 'Too many failed attempts. Please try again in 30 seconds.',
    'pin.tryAgain': 'Try Again',
    'pin.forgotPin': 'Forgot PIN?',
    'pin.recoveryPrompt': 'Initiate secure account recovery? You will need internet access to receive a recovery code via email.',
    'pin.incorrectPin': 'Incorrect PIN. Please try again.',
    'pin.noMatch': 'PINs do not match.',
    'pin.resetSuccess': 'PIN reset successfully!',
    'pin.changed': 'PIN changed successfully!',
    'pin.resetError': 'Failed to reset PIN. Please try again.',
    'pin.changeError': 'Failed to change PIN. Please try again.',
    
    // Categories
    'categories.title': 'Manage Categories',
    'categories.addNew': 'Add Category',
    'categories.editCategory': 'Edit Category',
    'categories.name': 'Category Name',
    'categories.type': 'Type',
    'categories.color': 'Color',
    'categories.revenue': 'Revenue',
    'categories.expense': 'Expense',
    'categories.noCategories': 'No categories found.',
    'categories.deleteConfirm': 'Are you sure you want to delete this category?',
    'categories.deleteError': 'Cannot delete category used in transactions',
    
    // Transactions
    'transactions.title': 'Recent Transactions',
    'transactions.addNew': 'Add Transaction',
    'transactions.amount': 'Amount',
    'transactions.category': 'Category',
    'transactions.date': 'Date',
    'transactions.description': 'Description',
    'transactions.type': 'Type',
    'transactions.noTransactions': 'No transactions found.',
    
    // Overview Page
    'overview.budgetAnalysisTitle': 'Budget Analysis',
    'overview.setBudgetButton': 'Set Budget',
    'overview.revenue': 'Revenue',
    'overview.expenses': 'Expenses',
    'overview.netIncome': 'Net Income',
    'overview.expenseSummaryTitle': 'Expense Summary',
    'overview.financialSummaryTitle': 'Financial Summary',
    'overview.toggleFinancialOverview': 'Show Financial Overview',
    'overview.toggleExpenseCategories': 'Show Expense Categories',
    'overview.toggleBarChart': 'Show Bar Chart',
    'overview.togglePieChart': 'Show Pie Chart',
    'overview.noData': 'No data to display',
    'overview.category': 'Category',
    'overview.percentage': 'Percentage',
    'overview.totalExpenses': 'Total Expenses',
    'overview.financialEntryType': 'Type',
    'overview.totalRevenueDescription': 'Total income generated',
    'overview.totalExpensesDescription': 'Total money spent',
    'overview.netIncomeDescription': 'Revenue minus expenses',
    'overview.noDataDescription': 'Start by adding some transactions.',
    'overview.amountLabel': 'Amount',
    'overview.subtitle': 'Here\'s your financial snapshot for {period}',
    'overview.setBudgetPrompt': 'Set your budget to see an analysis of your spending habits.',
    // Budget Modal
    'modal.setMonthlyBudgetTitle': 'Set Monthly Budget',
    'form.budgetAmountLabel': 'Budget Amount',
    'form.enterBudgetPlaceholder': 'Enter your budget',
  },
  
  'es-ES': {
    // Common
    'common.add': 'Añadir',
    'common.edit': 'Editar',
    'common.delete': 'Eliminar',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.loading': 'Cargando...',
    'common.currency': 'Moneda',
    'common.language': 'Idioma',
    'common.theme': 'Tema',
    'common.categories': 'Categorías',
    'common.settings': 'Ajustes',
    'common.ok': 'Aceptar',
    'common.yes': 'Sí',
    'common.no': 'No',
    'common.error': 'Error',
    'common.success': 'Éxito',
    
    // Navigation
    'nav.overview': 'Resumen',
    'nav.transactions': 'Transacciones',
    'nav.add': 'Añadir',
    'nav.reports': 'Informes',
    'nav.calendar': 'Calendario',
    'nav.categories': 'Categorías',
    'nav.settings': 'Ajustes',
    
    // Settings
    'settings.title': 'Ajustes',
    'settings.preferences': 'Preferencias',
    'settings.security': 'Seguridad',
    'settings.backup': 'Copia de seguridad y restauración',
    'settings.export': 'Exportar datos',
    'settings.import': 'Importar datos',
    'settings.reset': 'Reiniciar aplicación',
    'settings.resetConfirm': '¿Estás seguro de que quieres reiniciar la aplicación? Esto eliminará todos tus datos.',
    'settings.importSuccess': 'Datos importados con éxito',
    'settings.importError': 'Error al importar datos',
    
    // PIN Security
    'pin.setup': 'Configurar PIN',
    'pin.change': 'Cambiar PIN',
    'pin.disable': 'Desactivar PIN',
    'pin.unlock': 'Introducir PIN',
    'pin.enter': 'Introduce tu PIN',
    'pin.confirm': 'Confirmar PIN',
    'pin.recovery': 'Recuperación de cuenta',
    'pin.recoveryEmail': 'Correo de recuperación',
    'pin.recoveryEmailInfo': 'Este correo se utilizará para enviar un código de recuperación si olvidas tu PIN. Asegúrate de que sea una dirección de correo válida a la que tengas acceso.',
    'pin.recoveryCode': 'Código de recuperación',
    'pin.recoveryCodeInfo': 'Introduce el código de recuperación enviado a tu correo. El código es válido durante 15 minutos.',
    'pin.securityQuestion': 'Pregunta de seguridad',
    'pin.incorrectPin': 'PIN incorrecto. Inténtalo de nuevo.',
    'pin.noMatch': 'Los PIN no coinciden.',
    'pin.resetSuccess': '¡PIN restablecido con éxito!',
    'pin.changed': '¡PIN cambiado con éxito!',
    'pin.resetError': 'Error al restablecer el PIN. Inténtalo de nuevo.',
    'pin.changeError': 'Error al cambiar el PIN. Inténtalo de nuevo.',
    'pin.securityAnswer': 'Respuesta de seguridad',
    'pin.recoverySuccess': '¡Recuperación exitosa! Por favor, establece un nuevo PIN.',
    'pin.recoveryFailed': 'Recuperación fallida. Por favor, inténtalo de nuevo.',
    'pin.internet': 'Conexión a Internet',
    'pin.internetRequired': 'Se requiere conexión a Internet para enviar correo de recuperación.',
    'pin.locked': 'Demasiados intentos fallidos. Por favor, inténtalo de nuevo en 30 segundos.',
    'pin.tryAgain': 'Intentar de nuevo',
    'pin.forgotPin': '¿Olvidaste el PIN?',
    'pin.recoveryPrompt': '¿Iniciar recuperación segura de cuenta? Necesitarás acceso a Internet para recibir un código de recuperación por correo electrónico.',
    
    // Categories
    'categories.title': 'Administrar Categorías',
    'categories.addNew': 'Añadir Categoría',
    'categories.editCategory': 'Editar Categoría',
    'categories.name': 'Nombre de Categoría',
    'categories.type': 'Tipo',
    'categories.color': 'Color',
    'categories.revenue': 'Ingresos',
    'categories.expense': 'Gastos',
    'categories.noCategories': 'No se encontraron categorías.',
    'categories.deleteConfirm': '¿Estás seguro de que quieres eliminar esta categoría?',
    'categories.deleteError': 'No se puede eliminar una categoría utilizada en transacciones',
    
    // Transactions
    'transactions.title': 'Transacciones Recientes',
    'transactions.addNew': 'Añadir Transacción',
    'transactions.amount': 'Importe',
    'transactions.category': 'Categoría',
    'transactions.date': 'Fecha',
    'transactions.description': 'Descripción',
    'transactions.type': 'Tipo',
    'transactions.noTransactions': 'No se encontraron transacciones.',
    
    // Overview Page
    'overview.budgetAnalysisTitle': 'Análisis de Presupuesto',
    'overview.setBudgetButton': 'Establecer Presupuesto',
    'overview.revenue': 'Ingresos',
    'overview.expenses': 'Gastos',
    'overview.netIncome': 'Ingresos Netos',
    'overview.expenseSummaryTitle': 'Resumen de Gastos',
    'overview.financialSummaryTitle': 'Resumen Financiero',
    'overview.toggleFinancialOverview': 'Mostrar Resumen Financiero',
    'overview.toggleExpenseCategories': 'Mostrar Categorías de Gastos',
    'overview.toggleBarChart': 'Mostrar Gráfico de Barras',
    'overview.togglePieChart': 'Mostrar Gráfico Circular',
    'overview.noData': 'No hay datos para mostrar',
    'overview.category': 'Categoría',
    'overview.percentage': 'Porcentaje',
    'overview.totalExpenses': 'Gastos Totales',
    'overview.financialEntryType': 'Tipo',
    'overview.totalRevenueDescription': 'Ingresos totales generados',
    'overview.totalExpensesDescription': 'Dinero total gastado',
    'overview.netIncomeDescription': 'Ingresos menos gastos',
    'overview.noDataDescription': 'Comience agregando algunas transacciones.',
    'overview.amountLabel': 'Monto',
    'overview.subtitle': 'Este es tu resumen financiero para {period}',
    'overview.setBudgetPrompt': 'Establezca su presupuesto para ver un análisis de sus hábitos de gasto.',
    // Budget Modal
    'modal.setMonthlyBudgetTitle': 'Establecer Presupuesto Mensual',
    'form.budgetAmountLabel': 'Monto del Presupuesto',
    'form.enterBudgetPlaceholder': 'Ingrese su presupuesto',
  },
  
  'fr-FR': {
    // Common
    'common.add': 'Ajouter',
    'common.edit': 'Modifier',
    'common.delete': 'Supprimer',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.loading': 'Chargement...',
    'common.currency': 'Devise',
    'common.language': 'Langue',
    'common.theme': 'Thème',
    'common.categories': 'Catégories',
    'common.settings': 'Paramètres',
    'common.ok': 'OK',
    'common.yes': 'Oui',
    'common.no': 'Non',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    
    // Navigation
    'nav.overview': 'Aperçu',
    'nav.transactions': 'Transactions',
    'nav.add': 'Ajouter',
    'nav.reports': 'Rapports',
    'nav.calendar': 'Calendrier',
    'nav.categories': 'Catégories',
    'nav.settings': 'Paramètres',
    
    // Settings
    'settings.title': 'Paramètres',
    'settings.preferences': 'Préférences',
    'settings.security': 'Sécurité',
    'settings.backup': 'Sauvegarde et restauration',
    'settings.export': 'Exporter les données',
    'settings.import': 'Importer les données',
    'settings.reset': 'Réinitialiser l\'application',
    'settings.resetConfirm': 'Êtes-vous sûr de vouloir réinitialiser l\'application? Cela supprimera toutes vos données.',
    'settings.importSuccess': 'Données importées avec succès',
    'settings.importError': 'Échec de l\'importation des données',
    
    // PIN Security
    'pin.setup': 'Configurer le PIN',
    'pin.incorrectPin': 'PIN incorrect. Veuillez réessayer.',
    'pin.noMatch': 'Les PINs ne correspondent pas.',
    'pin.resetSuccess': 'PIN réinitialisé avec succès !',
    'pin.changed': 'PIN changé avec succès !',
    'pin.resetError': 'Échec de la réinitialisation du PIN. Veuillez réessayer.',
    'pin.changeError': 'Échec du changement de PIN. Veuillez réessayer.',
    'pin.change': 'Changer le PIN',
    'pin.disable': 'Désactiver le PIN',
    'pin.unlock': 'Entrer le PIN',
    'pin.enter': 'Entrez votre PIN',
    'pin.confirm': 'Confirmer le PIN',
    'pin.recovery': 'Récupération de compte',
    'pin.recoveryEmail': 'Email de récupération',
    'pin.recoveryEmailInfo': 'Cet email sera utilisé pour envoyer un code de récupération si vous oubliez votre PIN. Assurez-vous qu\'il s\'agit d\'une adresse email valide à laquelle vous avez accès.',
    'pin.recoveryCode': 'Code de récupération',
    'pin.recoveryCodeInfo': 'Entrez le code de récupération envoyé à votre email. Le code est valable pendant 15 minutes.',
    'pin.securityQuestion': 'Question de sécurité',
    'pin.securityAnswer': 'Réponse de sécurité',
    'pin.recoverySuccess': 'Récupération réussie ! Veuillez définir un nouveau PIN.',
    'pin.recoveryFailed': 'Échec de la récupération. Veuillez réessayer.',
    'pin.internet': 'Connexion Internet',
    'pin.internetRequired': 'Une connexion Internet est requise pour envoyer un email de récupération.',
    'pin.locked': 'Trop de tentatives échouées. Veuillez réessayer dans 30 secondes.',
    'pin.tryAgain': 'Réessayer',
    'pin.forgotPin': 'Oublié le PIN ?',
    'pin.recoveryPrompt': 'Lancer la récupération sécurisée du compte ? Vous aurez besoin d\'un accès Internet pour recevoir un code de récupération par email.',
    
    // Categories
    'categories.title': 'Gérer les catégories',
    'categories.addNew': 'Ajouter une catégorie',
    'categories.editCategory': 'Modifier la catégorie',
    'categories.name': 'Nom de la catégorie',
    'categories.type': 'Type',
    'categories.color': 'Couleur',
    'categories.revenue': 'Revenus',
    'categories.expense': 'Dépenses',
    'categories.noCategories': 'Aucune catégorie trouvée.',
    'categories.deleteConfirm': 'Êtes-vous sûr de vouloir supprimer cette catégorie?',
    'categories.deleteError': 'Impossible de supprimer une catégorie utilisée dans les transactions',
    
    // Transactions
    'transactions.title': 'Transactions récentes',
    'transactions.addNew': 'Ajouter une transaction',
    'transactions.amount': 'Montant',
    'transactions.category': 'Catégorie',
    'transactions.date': 'Date',
    'transactions.description': 'Description',
    'transactions.type': 'Type',
    'transactions.noTransactions': 'Aucune transaction trouvée.',
    
    // Overview Page
    'overview.budgetAnalysisTitle': 'Analyse du Budget',
    'overview.setBudgetButton': 'Définir le Budget',
    'overview.revenue': 'Revenus',
    'overview.expenses': 'Dépenses',
    'overview.netIncome': 'Revenu Net',
    'overview.expenseSummaryTitle': 'Résumé des Dépenses',
    'overview.financialSummaryTitle': 'Résumé Financier',
    'overview.toggleFinancialOverview': 'Afficher le Résumé Financier',
    'overview.toggleExpenseCategories': 'Afficher les Catégories de Dépenses',
    'overview.toggleBarChart': 'Afficher le Diagramme à Barres',
    'overview.togglePieChart': 'Afficher le Diagramme Circulaire',
    'overview.noData': 'Aucune donnée à afficher',
    'overview.category': 'Catégorie',
    'overview.percentage': 'Pourcentage',
    'overview.totalExpenses': 'Dépenses Totales',
    'overview.financialEntryType': 'Type',
    'overview.totalRevenueDescription': 'Revenu total généré',
    'overview.totalExpensesDescription': 'Argent total dépensé',
    'overview.netIncomeDescription': 'Revenus moins dépenses',
    'overview.noDataDescription': 'Commencez par ajouter quelques transactions.',
    'overview.amountLabel': 'Montant',
    'overview.subtitle': 'Voici votre aperçu financier pour {period}',
    'overview.setBudgetPrompt': 'Définissez votre budget pour voir une analyse de vos habitudes de dépenses.',
    // Budget Modal
    'modal.setMonthlyBudgetTitle': 'Définir le Budget Mensuel',
    'form.budgetAmountLabel': 'Montant du Budget',
    'form.enterBudgetPlaceholder': 'Entrez votre budget',
  }
};

// Function to get translation
export function getTranslation(language: string, key: TranslationKey): string {
  // If language doesn't exist, fall back to English
  if (!translations[language]) {
    language = 'en-US';
  }
  
  // If key doesn't exist, return the key itself
  return translations[language][key] || key;
}
