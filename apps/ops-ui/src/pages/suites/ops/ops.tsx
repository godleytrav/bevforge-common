import { AppShell } from '@/components/AppShell';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowUpRight, 
  AlertCircle, 
  CheckCircle2, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  FileText, 
  Download, 
  Beaker,
  Truck,
  AlertTriangle,
  Clock,
  XCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface Order {
  id: string;
  orderNumber: string;
  customer_name: string;
  customer_id: string;
  status: string;
  total_amount: number;
  deposit_amount: number;
  delivery_date: string;
  delivery_time: string;
  order_source: string;
  lineItems: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  stock_quantity: number;
  reorder_point: number;
  unit_price: number;
}

export default function OpsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/inventory/products')
        ]);
        
        const ordersData = await ordersRes.json();
        const productsData = await productsRes.json();
        
        setOrders(ordersData);
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Calculate real stats from API data
  const ordersRequiringAction = orders.filter(o => 
    o.status === 'draft' || o.status === 'confirmed'
  ).length;

  const ordersUnfulfilled = orders.filter(o => 
    o.status !== 'delivered' && o.status !== 'cancelled'
  ).length;

  const ordersDelivered = orders.filter(o => o.status === 'delivered').length;

  // Only count sales from DELIVERED orders (payment received)
  const salesTotal = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  const lowStockItems = products.filter(p => 
    p.stock_quantity <= (p.reorder_point || 10)
  ).length;

  // Inventory at risk (low stock only, no mock "damaged" or "expiring" data)
  const inventoryAtRisk = lowStockItems;

  // Deliveries scheduled (approved or in-delivery status)
  const deliveriesScheduled = orders.filter(o => 
    ['approved', 'in-packing', 'packed', 'loaded', 'in-delivery'].includes(o.status)
  ).length;

  // Overdue deliveries (past delivery date and not delivered)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deliveriesOverdue = orders.filter(o => {
    if (o.status === 'delivered' || o.status === 'cancelled') return false;
    const deliveryDate = new Date(o.delivery_date);
    deliveryDate.setHours(0, 0, 0, 0);
    return deliveryDate < today;
  }).length;

  // Compliance - no real data yet, set to 0
  const complianceDeadlines = 0;
  const complianceStatus: 'compliant' | 'at-risk' = 'compliant';

  // Orders requiring action (draft or confirmed)
  const actionableOrders = orders
    .filter(o => o.status === 'draft' || o.status === 'confirmed')
    .map(o => ({
      id: o.orderNumber,
      customer: o.customer_name,
      issue: o.status === 'draft' ? 'Needs approval' : 'Ready for processing',
      priority: o.status === 'draft' ? 'high' : 'medium'
    }));

  // Delivery status (scheduled deliveries)
  const deliveryStatus = orders
    .filter(o => ['approved', 'in-packing', 'packed', 'loaded', 'in-delivery'].includes(o.status))
    .map(o => {
      const deliveryDate = new Date(o.delivery_date);
      const isOverdue = deliveryDate < today;
      return {
        id: o.orderNumber,
        destination: o.customer_name,
        status: isOverdue ? 'overdue' : o.status === 'in-delivery' ? 'in-transit' : 'scheduled',
        dueDate: new Date(o.delivery_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      };
    });

  // Sales by channel (only from delivered orders)
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const salesByChannel = [
    {
      channel: 'Website',
      amount: deliveredOrders.filter(o => o.order_source === 'web').reduce((sum, o) => sum + o.total_amount, 0),
      count: deliveredOrders.filter(o => o.order_source === 'web').length
    },
    {
      channel: 'Phone',
      amount: deliveredOrders.filter(o => o.order_source === 'phone').reduce((sum, o) => sum + o.total_amount, 0),
      count: deliveredOrders.filter(o => o.order_source === 'phone').length
    },
    {
      channel: 'Email',
      amount: deliveredOrders.filter(o => o.order_source === 'email').reduce((sum, o) => sum + o.total_amount, 0),
      count: deliveredOrders.filter(o => o.order_source === 'email').length
    }
  ].filter(c => c.count > 0); // Only show channels with delivered orders

  // Calculate percentages
  const totalChannelSales = salesByChannel.reduce((sum, c) => sum + c.amount, 0);
  const salesByChannelWithPercent = salesByChannel.map(c => ({
    ...c,
    percent: totalChannelSales > 0 ? Math.round((c.amount / totalChannelSales) * 100) : 0
  }));

  // Recent orders (last 3)
  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3)
    .map(o => ({
      id: o.orderNumber,
      customer: o.customer_name,
      amount: `${parseFloat(String(o.total_amount)).toFixed(2)}`,
      status: o.status === 'delivered' ? 'Delivered' : 
              o.status === 'approved' ? 'Processing' : 
              o.status === 'draft' ? 'Draft' : 
              'In Progress'
    }));

  // Inventory alerts (low stock items only)
  const inventoryAlerts = products
    .filter(p => p.stock_quantity <= (p.reorder_point || 10))
    .map(p => ({
      product: p.name,
      quantity: p.stock_quantity,
      unit: 'units',
      risk: 'low-stock'
    }));

  if (loading) {
    return (
      <AppShell pageTitle="OPS — Business Overview">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="OPS — Business Overview">
      <div className="space-y-6">
        {/* Header with Date Range Selector */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">OPS — Business Overview</h1>
            <p className="text-muted-foreground mt-1">BevForge operations dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => (window.location.href = '/ops/canvas-logistics')}
            >
              <Truck className="h-4 w-4" />
              Logistics Canvas
            </Button>
            <Select defaultValue="today">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* CRITICAL ALERTS BANNER */}
        {(ordersRequiringAction > 0 || deliveriesOverdue > 0 || complianceDeadlines > 0 || inventoryAtRisk > 0) && (
          <Card className="border-red-500/50 bg-red-500/10">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <CardTitle className="text-lg">Items Requiring Attention</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {ordersRequiringAction > 0 && (
                  <Link to="/ops/orders" className="flex items-center gap-2 text-sm hover:underline">
                    <Badge variant="destructive">{ordersRequiringAction}</Badge>
                    <span>Orders need action</span>
                  </Link>
                )}
                {deliveriesOverdue > 0 && (
                  <Link to="/ops/orders" className="flex items-center gap-2 text-sm hover:underline">
                    <Badge variant="destructive">{deliveriesOverdue}</Badge>
                    <span>Overdue deliveries</span>
                  </Link>
                )}
                {complianceDeadlines > 0 && (
                  <Link to="/ops/compliance" className="flex items-center gap-2 text-sm hover:underline">
                    <Badge variant="destructive">{complianceDeadlines}</Badge>
                    <span>Compliance deadlines approaching</span>
                  </Link>
                )}
                {inventoryAtRisk > 0 && (
                  <Link to="/ops/inventory" className="flex items-center gap-2 text-sm hover:underline">
                    <Badge variant="destructive">{inventoryAtRisk}</Badge>
                    <span>Inventory items at risk</span>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick-Look Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Orders Requiring Action Tile */}
          <Link to="/ops/orders">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg ${ordersRequiringAction > 0 ? 'border-yellow-500/50' : 'border-border'}`}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = ordersRequiringAction > 0 
                  ? '0 0 20px rgba(234, 179, 8, 0.4)'
                  : '0 0 20px rgba(166, 173, 186, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders - Action Required</CardTitle>
                <AlertCircle className={`h-4 w-4 ${ordersRequiringAction > 0 ? 'text-yellow-500' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${ordersRequiringAction > 0 ? 'text-yellow-500' : ''}`}>
                  {ordersRequiringAction}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {ordersRequiringAction > 0 ? 'Need immediate attention' : 'All orders processed'}
                </p>
                <Button variant="link" className="mt-2 p-0 h-auto text-xs">
                  View Orders <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Deliveries Tile */}
          <Link to="/ops/orders">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg ${deliveriesOverdue > 0 ? 'border-red-500/50' : 'border-border'}`}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = deliveriesOverdue > 0 
                  ? '0 0 20px rgba(239, 68, 68, 0.4)'
                  : '0 0 20px rgba(166, 173, 186, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Deliveries</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{deliveriesScheduled}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {deliveriesOverdue > 0 ? (
                    <span className="text-red-500 font-semibold">{deliveriesOverdue} overdue</span>
                  ) : deliveriesScheduled > 0 ? (
                    'All on schedule'
                  ) : (
                    'No scheduled deliveries'
                  )}
                </p>
                <Button variant="link" className="mt-2 p-0 h-auto text-xs">
                  View Deliveries <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Compliance Tile */}
          <Link to="/ops/compliance">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg ${complianceStatus === 'at-risk' ? 'border-yellow-500/50' : 'border-border'}`}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = complianceStatus === 'at-risk'
                  ? '0 0 20px rgba(234, 179, 8, 0.4)'
                  : '0 0 20px rgba(34, 197, 94, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Compliance</CardTitle>
                {complianceStatus === 'at-risk' ? (
                  <Clock className="h-4 w-4 text-yellow-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{complianceDeadlines}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {complianceStatus === 'at-risk' ? 'Deadlines approaching' : 'All requirements met'}
                </p>
                <Button variant="link" className="mt-2 p-0 h-auto text-xs">
                  View Compliance <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Inventory At Risk Tile */}
          <Link to="/ops/inventory">
            <Card 
              className={`cursor-pointer transition-all hover:shadow-lg ${inventoryAtRisk > 0 ? 'border-red-500/50' : 'border-border'}`}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = inventoryAtRisk > 0
                  ? '0 0 20px rgba(239, 68, 68, 0.4)'
                  : '0 0 20px rgba(166, 173, 186, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory At Risk</CardTitle>
                <AlertTriangle className={`h-4 w-4 ${inventoryAtRisk > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${inventoryAtRisk > 0 ? 'text-red-500' : ''}`}>
                  {inventoryAtRisk}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {inventoryAtRisk > 0 ? 'Low stock items' : 'All stock levels healthy'}
                </p>
                <Button variant="link" className="mt-2 p-0 h-auto text-xs">
                  View Inventory <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Sales Tile */}
          <Link to="/ops/sales">
            <Card 
              className="cursor-pointer transition-all hover:shadow-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid hsl(200, 15%, 65%)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(166, 173, 186, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${parseFloat(String(salesTotal)).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {ordersDelivered > 0 ? `From ${ordersDelivered} delivered order${ordersDelivered > 1 ? 's' : ''}` : 'No sales yet'}
                </p>
                <Button variant="link" className="mt-2 p-0 h-auto text-xs">
                  View Sales <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* All Orders Tile */}
          <Link to="/ops/orders">
            <Card 
              className="cursor-pointer transition-all hover:shadow-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid hsl(200, 15%, 65%)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(166, 173, 186, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">All Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{orders.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {ordersUnfulfilled > 0 ? `${ordersUnfulfilled} unfulfilled` : 'All orders fulfilled'}
                </p>
                <Button variant="link" className="mt-2 p-0 h-auto text-xs">
                  View All Orders <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* All Inventory Tile */}
          <Link to="/ops/inventory">
            <Card 
              className="cursor-pointer transition-all hover:shadow-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid hsl(200, 15%, 65%)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(166, 173, 186, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">All Inventory</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {lowStockItems > 0 ? `${lowStockItems} low stock` : 'All stock levels healthy'}
                </p>
                <Button variant="link" className="mt-2 p-0 h-auto text-xs">
                  View All Inventory <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          {/* Batches Tile */}
          <Link to="/ops/batches">
            <Card 
              className="cursor-pointer transition-all hover:shadow-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid hsl(200, 15%, 65%)',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(166, 173, 186, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Batches</CardTitle>
                <Beaker className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground mt-1">
                  No active batches
                </p>
                <Button variant="link" className="mt-2 p-0 h-auto text-xs">
                  View Batches <ArrowUpRight className="ml-1 h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Action Center */}
        <Card style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid hsl(200, 15%, 65%)',
          backdropFilter: 'blur(12px)',
        }}>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Fast-access operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm">
                <Package className="mr-2 h-4 w-4" />
                Create New Product
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Receive Inventory
              </Button>
              <Button variant="outline" size="sm">
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Sync Website Store
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Supporting Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders Requiring Action */}
          {actionableOrders.length > 0 && (
            <Card style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid hsl(200, 15%, 65%)',
              backdropFilter: 'blur(12px)',
            }}>
              <CardHeader>
                <CardTitle>Orders Requiring Action</CardTitle>
                <CardDescription>Issues that need resolution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {actionableOrders.slice(0, 3).map((order) => (
                    <Link 
                      key={order.id} 
                      to="/ops/orders"
                      className="flex items-center justify-between p-2 rounded hover:bg-accent/10 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{order.id}</p>
                          <Badge 
                            variant={order.priority === 'high' ? 'destructive' : 'default'}
                            className="text-xs"
                          >
                            {order.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{order.customer}</p>
                        <p className="text-xs text-yellow-500 mt-1">{order.issue}</p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
                {actionableOrders.length > 3 && (
                  <Button variant="link" className="mt-3 p-0 h-auto text-xs w-full justify-center">
                    View all {actionableOrders.length} orders
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Delivery Status */}
          {deliveryStatus.length > 0 && (
            <Card style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid hsl(200, 15%, 65%)',
              backdropFilter: 'blur(12px)',
            }}>
              <CardHeader>
                <CardTitle>Delivery Status</CardTitle>
                <CardDescription>Scheduled and in-transit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deliveryStatus.slice(0, 4).map((delivery) => (
                    <Link 
                      key={delivery.id} 
                      to="/ops/orders"
                      className="flex items-center justify-between p-2 rounded hover:bg-accent/10 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{delivery.id}</p>
                          {delivery.status === 'overdue' && (
                            <XCircle className="h-3 w-3 text-red-500" />
                          )}
                          {delivery.status === 'in-transit' && (
                            <Truck className="h-3 w-3 text-blue-500" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{delivery.destination}</p>
                        <p className={`text-xs mt-1 ${delivery.status === 'overdue' ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
                          Due: {delivery.dueDate}
                        </p>
                      </div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sales by Channel */}
          {salesByChannelWithPercent.length > 0 && (
            <Card style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid hsl(200, 15%, 65%)',
              backdropFilter: 'blur(12px)',
            }}>
              <CardHeader>
                <CardTitle>Sales by Channel</CardTitle>
                <CardDescription>From delivered orders only</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesByChannelWithPercent.map((channel) => (
                    <div key={channel.channel} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{channel.channel}</p>
                        <p className="text-xs text-muted-foreground">{channel.percent}% of total</p>
                      </div>
                      <p className="text-sm font-bold">${parseFloat(String(channel.amount)).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Additional Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          {recentOrders.length > 0 && (
            <Card style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid hsl(200, 15%, 65%)',
              backdropFilter: 'blur(12px)',
            }}>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{order.id}</p>
                        <p className="text-xs text-muted-foreground">{order.customer}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{order.amount}</p>
                        <p className="text-xs text-muted-foreground">{order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inventory Alerts */}
          {inventoryAlerts.length > 0 && (
            <Card style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid hsl(200, 15%, 65%)',
              backdropFilter: 'blur(12px)',
            }}>
              <CardHeader>
                <CardTitle>Inventory Alerts</CardTitle>
                <CardDescription>Items needing attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inventoryAlerts.slice(0, 4).map((item, idx) => (
                    <Link 
                      key={idx} 
                      to="/ops/inventory"
                      className="flex items-center justify-between p-2 rounded hover:bg-accent/10 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.product}</p>
                        <p className="text-xs font-semibold text-orange-500">Low stock</p>
                      </div>
                      <p className="text-sm font-bold">{item.quantity} {item.unit}</p>
                    </Link>
                  ))}
                </div>
                {inventoryAlerts.length > 4 && (
                  <Button variant="link" className="mt-3 p-0 h-auto text-xs w-full justify-center">
                    View all alerts
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Empty State */}
        {orders.length === 0 && products.length === 0 && (
          <Card style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid hsl(200, 15%, 65%)',
            backdropFilter: 'blur(12px)',
          }}>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Start by adding products to inventory and creating orders.
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => window.location.href = '/ops/inventory'}>
                  <Package className="mr-2 h-4 w-4" />
                  Add Products
                </Button>
                <Button onClick={() => window.location.href = '/ops/orders'}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Create Order
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
