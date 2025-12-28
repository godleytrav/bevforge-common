import { RouteObject } from 'react-router-dom';

// Direct imports instead of lazy loading
import IndexPage from './pages/suites/bevforge/index';
import NotFoundPage from './pages/_404';
import ConnectPage from './pages/suites/connect/connect';
import FlowPage from './pages/suites/flow/flow';
import LabPage from './pages/suites/lab/lab';
import OpsPage from './pages/suites/ops/ops';
import OsPage from './pages/suites/os/os';
import ReportsPage from './pages/reports';
import SettingsPage from './pages/settings';
import ProfilePage from './pages/profile';
import HelpPage from './pages/help';
import CalendarPage from './pages/suites/ops/calendar';
import NotificationsPage from './pages/notifications';
import DirectoryPage from './pages/suites/ops/directory';
import TasksPage from './pages/suites/ops/tasks';

// OPS subpages
import OrdersPage from './pages/ops/orders';
import InventoryPage from './pages/ops/inventory';
import BatchesPage from './pages/ops/batches';
import SalesPage from './pages/ops/sales';
import TaxPage from './pages/ops/tax';
import CompliancePage from './pages/ops/compliance';
import OpsReportsPage from './pages/ops/reports';
import ProductsPage from './pages/ops/products';
import InvoicingPage from './pages/ops/invoicing';
import LabelsPage from './pages/ops/labels';
import RecipesPage from './pages/ops/recipes';
import QualityPage from './pages/ops/quality';
import CanvasPage from './pages/ops/canvas';
import CanvasDemoPage from './pages/ops/canvas-demo';
import CanvasHybridPage from './pages/ops/canvas-hybrid';
import CanvasV3Page from './pages/ops/canvas-v3';
import CanvasLogisticsPage from './pages/ops/canvas-logistics';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <IndexPage />,
  },
  {
    path: '/connect',
    element: <ConnectPage />,
  },
  {
    path: '/flow',
    element: <FlowPage />,
  },
  {
    path: '/lab',
    element: <LabPage />,
  },
  {
    path: '/ops',
    element: <OpsPage />,
  },
  {
    path: '/ops/orders',
    element: <OrdersPage />,
  },
  {
    path: '/ops/inventory',
    element: <InventoryPage />,
  },
  {
    path: '/ops/batches',
    element: <BatchesPage />,
  },
  {
    path: '/ops/sales',
    element: <SalesPage />,
  },
  {
    path: '/ops/tax',
    element: <TaxPage />,
  },
  {
    path: '/ops/compliance',
    element: <CompliancePage />,
  },
  {
    path: '/ops/reports',
    element: <OpsReportsPage />,
  },
  {
    path: '/ops/products',
    element: <ProductsPage />,
  },
  {
    path: '/ops/invoicing',
    element: <InvoicingPage />,
  },
  {
    path: '/ops/labels',
    element: <LabelsPage />,
  },
  {
    path: '/ops/recipes',
    element: <RecipesPage />,
  },
  {
    path: '/ops/quality',
    element: <QualityPage />,
  },
  {
    path: '/ops/canvas',
    element: <CanvasPage />,
  },
  {
    path: '/ops/canvas-demo',
    element: <CanvasDemoPage />,
  },
  {
    path: '/ops/canvas-hybrid',
    element: <CanvasHybridPage />,
  },
  {
    path: '/ops/canvas-v3',
    element: <CanvasV3Page />,
  },
  {
    path: '/ops/canvas-logistics',
    element: <CanvasLogisticsPage />,
  },
  {
    path: '/directory',
    element: <DirectoryPage />,
  },
  {
    path: '/tasks',
    element: <TasksPage />,
  },
  {
    path: '/os',
    element: <OsPage />,
  },
  {
    path: '/reports',
    element: <ReportsPage />,
  },
    {
      path: '/settings',
      element: <SettingsPage />,
    },
    {
      path: '/profile',
      element: <ProfilePage />,
    },
    {
      path: '/help',
      element: <HelpPage />,
    },
    {
      path: '/calendar',
      element: <CalendarPage />,
    },
    {
      path: '/notifications',
      element: <NotificationsPage />,
    },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];
