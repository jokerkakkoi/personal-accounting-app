import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import AppRoutes from './config/routes';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster position="top-center" richColors closeButton />
    </BrowserRouter>
  );
}

export default App;
