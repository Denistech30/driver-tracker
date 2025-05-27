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
  | 'transactions.noTransactions';

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
    'transactions.noTransactions': 'No transactions found.'
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
    'transactions.noTransactions': 'No se encontraron transacciones.'
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
    'transactions.noTransactions': 'Aucune transaction trouvée.'
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
