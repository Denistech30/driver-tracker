import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import PinModal from './components/PinModal';
import Overview from './pages/Overview';
import Transactions from './pages/Transactions';
import AddTransaction from './pages/AddTransaction';
import Reports from './pages/Reports';
import Calendar from './pages/Calendar';
import Categories from './pages/Categories';
import Settings from './pages/Settings';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <>
      <PinModal />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="add-transaction" element={<AddTransaction />} />
          <Route path="reports" element={<Reports />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="categories" element={<Categories />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}

export default App;