import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';

// Import all pages
import WelcomePage from '../pages/WelcomePage';
import HomePage from '../pages/HomePage';
import TransactionFormPage from '../pages/TransactionFormPage';
import TransactionDetailPage from '../pages/TransactionDetailPage';
import SearchPage from '../pages/SearchPage';
import CategoriesPage from '../pages/CategoriesPage';
import BudgetsPage from '../pages/BudgetsPage';
import BudgetHistoryPage from '../pages/BudgetHistoryPage';
import ReportsPage from '../pages/ReportsPage';
import TrendsPage from '../pages/TrendsPage';
import CategoryBreakdownPage from '../pages/CategoryBreakdownPage';
import AISettingsPage from '../pages/AISettingsPage';
import BackupRestorePage from '../pages/BackupRestorePage';
import SettingsPage from '../pages/SettingsPage';

import { useAppStore } from '../stores/app-store';

export const AppRoutes: React.FC = () => {
  const hasSeenWelcome = useAppStore(state => state.settings.hasSeenWelcome);

  return (
    <Routes>
      {/* Onboarding welcome page */}
      <Route element={<AppLayout />}>
        <Route 
          path="/welcome" 
          element={hasSeenWelcome ? <Navigate to="/" replace /> : <WelcomePage />} 
        />
      </Route>
      
      {/* Protected Core App routes */}
      <Route element={hasSeenWelcome ? <AppLayout /> : <Navigate to="/welcome" replace />}>
        {/* Home */}
        <Route path="/" element={<HomePage />} />
        
        {/* Transactions */}
        <Route path="/transaction/new" element={<TransactionFormPage />} />
        <Route path="/transaction/edit/:id" element={<TransactionFormPage />} />
        <Route path="/transaction/:id" element={<TransactionDetailPage />} />
        
        {/* Search */}
        <Route path="/search" element={<SearchPage />} />
        
        {/* Categories */}
        <Route path="/categories" element={<CategoriesPage />} />
        
        {/* Budgets */}
        <Route path="/budgets" element={<BudgetsPage />} />
        <Route path="/budgets/history" element={<BudgetHistoryPage />} />
        
        {/* Reports */}
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/trends" element={<TrendsPage />} />
        <Route path="/reports/categories" element={<CategoryBreakdownPage />} />
        
        {/* Settings Sub-pages */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/ai" element={<AISettingsPage />} />
        <Route path="/settings/backup" element={<BackupRestorePage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
export default AppRoutes;
