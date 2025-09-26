import { Outlet, NavLink } from 'react-router-dom';
import { Home, List, Plus, FileText, Calendar as CalendarIcon, Tag, Settings as SettingsIcon } from 'lucide-react';
import InstallPrompt from './InstallPrompt';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: 'Overview', path: '/', icon: Home },
  { name: 'Transactions', path: '/transactions', icon: List },
  { name: 'Add', path: '/add-transaction', icon: Plus },
  { name: 'Reports', path: '/reports', icon: FileText },
  { name: 'Calendar', path: '/calendar', icon: CalendarIcon },
];

function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b pb-2 w-full mb-6">
        <div className="container mx-auto p-4 max-w-4xl flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full flex items-center justify-center overflow-hidden">
              <img src="/pwa-192x192 (2).png" alt="Xpense Logo" className="h-full w-full object-contain" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:inline">Xpense</h1>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:hidden">Xpense</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NavLink 
              to="/settings" 
              className={({ isActive }) => `p-2 rounded-md ${isActive ? 'bg-gray-100 dark:bg-gray-800 text-primary' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-100'}`} 
              aria-label="Settings"
            >
              <SettingsIcon className="h-5 w-5" />
            </NavLink>
            <NavLink 
              to="/categories" 
              className={({ isActive }) => `p-2 rounded-md hidden sm:flex items-center gap-1 ${isActive ? 'bg-gray-100 dark:bg-gray-800 text-primary' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-100'}`} 
              aria-label="Categories"
            >
              <Tag className="h-4 w-4" />
              <span>Categories</span>
            </NavLink>
            <NavLink 
              to="/categories" 
              className={({ isActive }) => `p-2 rounded-md sm:hidden ${isActive ? 'bg-gray-100 dark:bg-gray-800 text-primary' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-100'}`} 
              aria-label="Categories"
            >
              <Tag className="h-4 w-4" />
            </NavLink>
          </div>
        </div>
        {/* Install prompt banner mounts here so it sits beneath the header and above content */}
        <InstallPrompt />
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4 pb-20 max-w-4xl">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t bg-white dark:bg-gray-900 dark:border-gray-800 shadow-lg">
        <div className="grid h-full grid-cols-5 items-center max-w-4xl mx-auto px-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex h-full flex-col items-center justify-center space-y-1 transition-colors duration-200 ${item.name === 'Add' ? 'relative' : ''} ${
                  isActive 
                    ? 'text-primary font-medium'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                }`
              }
              aria-label={item.name}
            >
              {item.name === 'Add' ? (
                <>
                  <div className="absolute -top-6 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95">
                    <item.icon className="h-6 w-6" />
                  </div>
                  <span className="mt-6 text-xs font-medium">Add</span>
                </>
              ) : (
                <>
                  <div className="relative">
                    <item.icon className="h-5 w-5" />
                    {item.path === '/transactions' && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary"></span>
                    )}
                  </div>
                  <span className="text-xs">{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default Layout;