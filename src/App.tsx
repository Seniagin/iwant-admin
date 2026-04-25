import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { Layout } from './components/Layout';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { CategoriesPage } from './pages/CategoriesPage';
import { DemandsPage } from './pages/DemandsPage';
import { BusinessUsersPage } from './pages/BusinessUsersPage';
import { BusinessUserCreatePage } from './pages/BusinessUserCreatePage';
import { BusinessUserDetailsPage } from './pages/BusinessUserDetailsPage';
import { UsersPage } from './pages/UsersPage';
import { UserCreatePage } from './pages/UserCreatePage';
import { UserDetailsPage } from './pages/UserDetailsPage';
import EditBusinessPage from './pages/EditBusinessPage';
import { SnackbarProvider } from './contexts/SnackbarContext';

function App() {
  return (
    <SnackbarProvider>
      <Router>
        <div className="App">
          <Layout>
            <Navigation />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/demands" element={<DemandsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/users/new" element={<UserCreatePage />} />
              <Route path="/users/:userId" element={<UserDetailsPage />} />
              <Route
                path="/business-users/:userId/businesses/:businessId/edit"
                element={<EditBusinessPage />}
              />
              <Route path="/business-users" element={<BusinessUsersPage />} />
              <Route path="/business-users/new" element={<BusinessUserCreatePage />} />
              <Route path="/business-users/:userId" element={<BusinessUserDetailsPage />} />
            </Routes>
          </Layout>
        </div>
      </Router>
    </SnackbarProvider>
  );
}

export default App;
