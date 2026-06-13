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
import BusinessDashboardPage from './pages/BusinessDashboardPage';
import BusinessDemandsDetailPage from './pages/BusinessDemandsDetailPage';
import { CategoryBusinessesPage } from './pages/CategoryBusinessesPage';
import { LowCoverageDemandsPage } from './pages/LowCoverageDemandsPage';
import { RejectedMessagesPage } from './pages/RejectedMessagesPage';
import { BusinessesListPage } from './pages/BusinessesListPage';
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
              {/* Dashboard reachable both from business-users and businesses list */}
              <Route path="/businesses/:businessId" element={<BusinessDashboardPage />} />
              <Route path="/businesses/:businessId/demands" element={<BusinessDemandsDetailPage />} />
              <Route
                path="/business-users/:userId/businesses/:businessId"
                element={<BusinessDashboardPage />}
              />
              <Route
                path="/business-users/:userId/businesses/:businessId/demands"
                element={<BusinessDemandsDetailPage />}
              />
              <Route
                path="/business-users/:userId/businesses/:businessId/edit"
                element={<EditBusinessPage />}
              />
              <Route path="/business-users" element={<BusinessUsersPage />} />
              <Route path="/business-users/new" element={<BusinessUserCreatePage />} />
              <Route path="/business-users/:userId" element={<BusinessUserDetailsPage />} />
              <Route path="/categories/:categoryId/businesses" element={<CategoryBusinessesPage />} />
              <Route path="/low-coverage-demands" element={<LowCoverageDemandsPage />} />
              <Route path="/businesses" element={<BusinessesListPage />} />

              <Route path="/rejected-messages" element={<RejectedMessagesPage />} />
            </Routes>
          </Layout>
        </div>
      </Router>
    </SnackbarProvider>
  );
}

export default App;
