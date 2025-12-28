import { RouteObject } from 'react-router-dom';
import { lazy } from 'react';
import HomePage from './pages/index';
import ItemDetailsRouter from './pages/os/ItemDetailsRouter';
import ControlPanelPage from './pages/os/ControlPanelPage';
import AddInventoryItemPage from './pages/os/AddInventoryItemPage';
import DevicesPage from './pages/os/DevicesPage';
import InventoryManagementPage from './pages/os/InventoryManagementPage';

// Lazy load components for code splitting (except HomePage for instant loading)
const isDevelopment = (import.meta.env as any).DEV;
const NotFoundPage = isDevelopment ? lazy(() => import('../dev-tools/src/PageNotFound')) : lazy(() => import('./pages/_404'));

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/os',
    element: <HomePage />,
  },
  {
    path: '/os/devices',
    element: <DevicesPage />,
  },
  {
    path: '/os/inventory',
    element: <InventoryManagementPage />,
  },
  {
    path: '/os/inventory/add',
    element: <AddInventoryItemPage />,
  },
  {
    path: '/os/inventory/:id',
    element: <ItemDetailsRouter />,
  },
  {
    path: '/os/control-panel',
    element: <ControlPanelPage />,
  },
  {
    path: '/os/batches',
    element: <NotFoundPage />, // Placeholder - will be implemented
  },
  {
    path: '/os/materials',
    element: <NotFoundPage />, // Placeholder - will be implemented
  },
  {
    path: '/os/locations',
    element: <NotFoundPage />, // Placeholder - will be implemented
  },
  {
    path: '/os/movements',
    element: <NotFoundPage />, // Placeholder - will be implemented
  },
  {
    path: '/ops',
    element: <NotFoundPage />, // Placeholder for OPS suite
  },
  {
    path: '/lab',
    element: <NotFoundPage />, // Placeholder for Lab suite
  },
  {
    path: '/connect',
    element: <NotFoundPage />, // Placeholder for Connect suite
  },
  {
    path: '/flow',
    element: <NotFoundPage />, // Placeholder for Flow suite
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

// Types for type-safe navigation
export type Path = '/' | '/os' | '/os/inventory' | '/os/inventory/:id' | '/os/control-panel' | '/os/batches' | '/os/materials' | '/os/locations' | '/os/movements' | '/ops' | '/lab' | '/connect' | '/flow';

export type Params = Record<string, string | undefined>;
