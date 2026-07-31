import { lazy } from 'react';

// project imports
import MainLayout from 'layout/MainLayout';
import Loadable from 'ui-component/Loadable';
import ProtectedRoute from './ProtectedRoute';
import TablesPage from '../views/tables';

// dashboard routing
const DashboardDefault = Loadable(lazy(() => import('views/dashboard/Default')));

// utilities routing
// const UtilsTypography = Loadable(lazy(() => import('views/utilities/Typography')));
// const UtilsColor = Loadable(lazy(() => import('views/utilities/Color')));
// const UtilsShadow = Loadable(lazy(() => import('views/utilities/Shadow')));

// admin routing
const RegionPage = Loadable(lazy(() => import('views/region')));
const StorePage = Loadable(lazy(() => import('views/store')));
const BrandsPage = Loadable(lazy(() => import('views/brands')));
const ProductsPage = Loadable(lazy(() => import('views/products')));
const CategoryPage = Loadable(lazy(() => import('views/category')));
const SecurityTypePage = Loadable(lazy(() => import('views/security-types')));
const DisplayRecordsPage = Loadable(lazy(() => import('views/display-record')));
const UserManagementPage = Loadable(lazy(() => import('views/user-management')));
const AdminChangeRequest = Loadable(lazy(() => import('views/admin-change-request')));
const AdminActivity = Loadable(lazy(() => import('views/activity')));


// user routing
const ChangeRequestPage = Loadable(lazy(() => import('views/change-request')));

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: (
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  ),
  children: [
    {
      path: '/',
      element: <DashboardDefault />
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    },
    {
      path: 'region',
      element: <RegionPage />
    },
    {
      path: 'store',
      element: <StorePage />
    },
    {
      path: 'brands',
      element: <BrandsPage />
    },
    {
      path: 'categories',
      element: <CategoryPage />
    },
    {
      path: 'products',
      element: <ProductsPage />
    },
    {
      path: 'tables',
      element: <TablesPage />
    },
    {
      path: 'security-types',
      element: <SecurityTypePage />
    },
    {
      path: 'display-record',
      element: <DisplayRecordsPage />
    },
    {
      path: 'user-management',
      element: <UserManagementPage />
    },
    {
      path: 'admin-change-request',
      element: <AdminChangeRequest />
    },
    {
      path: 'activity',
      element: <AdminActivity />
    },

    // user routing

    {
      path: 'change-request',
      element: <ChangeRequestPage />
    },
  ]
};

export default MainRoutes;
