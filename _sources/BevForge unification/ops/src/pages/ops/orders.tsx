import { useState, useEffect, useMemo } from 'react';
import { AppShell } from '@/components/AppShell';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Trash2, Edit, Calendar, AlertCircle, Clock, CheckCircle2, Package } from 'lucide-react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type OrderStatus = 'draft' | 'confirmed' | 'approved' | 'in-packing' | 'packed' | 'loaded' | 'in-delivery' | 'delivered' | 'cancelled';

interface LineItem {
  id?: string;
  productId?: string;
  productName?: string;
  containerTypeId?: string;
  containerType?: string;
  quantity: number;
  unitPrice: number;
  depositPerUnit?: number;
  totalPrice: number;
  totalDeposit?: number;
  // Legacy fields for form compatibility
  item_name?: string;
  qty?: number;
  price?: number;
}

interface Order {
  id: string;
  orderNumber?: string;
  customerId?: string;
  customer_name: string;
  order_date: string;
  delivery_date?: string;
  status: OrderStatus;
  total_amount: number | string;
  deposit_amount?: number | string;
  lineItems: LineItem[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

const statusColors: Record<OrderStatus, string> = {
  draft: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  confirmed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  approved: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'in-packing': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  packed: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  loaded: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  'in-delivery': 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  delivered: 'bg-green-500/10 text-green-500 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export default function Orders() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  
  // Create/Edit modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    order_date: new Date().toISOString().split('T')[0],
    status: 'draft' as OrderStatus,
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { item_name: '', qty: 1, price: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Check for URL parameters to pre-fill customer
  useEffect(() => {
    const customerName = searchParams.get('customer');
    if (customerName) {
      setFormData(prev => ({ ...prev, customer_name: customerName }));
      setIsCreateOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet<Order[]>('/api/orders');
      const ordersArray = Array.isArray(data) ? data : [];
      setOrders(ordersArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    try {
      setSubmitting(true);
      const validLineItems = lineItems.filter(
        (item) => item.item_name.trim() && item.qty > 0 && item.price >= 0
      );

      if (validLineItems.length === 0) {
        alert('Please add at least one valid line item');
        return;
      }

      const total = validLineItems.reduce((sum, item) => sum + item.qty * item.price, 0);

      await apiPost('/api/orders', {
        ...formData,
        line_items: validLineItems,
        total,
      });

      await fetchOrders();
      setIsCreateOpen(false);
      resetForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;

    try {
      setSubmitting(true);
      const validLineItems = lineItems.filter(
        (item) => item.item_name.trim() && item.qty > 0 && item.price >= 0
      );

      if (validLineItems.length === 0) {
        alert('Please add at least one valid line item');
        return;
      }

      const total = validLineItems.reduce((sum, item) => sum + item.qty * item.price, 0);

      await apiPatch(`/api/orders/${editingOrder.id}`, {
        ...formData,
        line_items: validLineItems,
        total,
      });

      await fetchOrders();
      setEditingOrder(null);
      resetForm();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      await apiDelete(`/api/orders/${orderId}`);
      await fetchOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete order');
    }
  };

  const handleApproveOrder = async (orderId: number) => {
    if (!confirm('Approve this order for logistics processing?')) return;

    try {
      await apiPatch(`/api/orders/${orderId}`, {
        status: 'approved',
      });
      await fetchOrders();
      alert('Order approved! It will now appear in the Logistics Canvas.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve order');
    }
  };

  const openEditModal = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      customer_name: order.customer_name,
      order_date: order.order_date,
      status: order.status,
    });
    setLineItems(order.lineItems.length > 0 ? [...order.lineItems] : [{ item_name: '', qty: 1, price: 0 }]);
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      order_date: new Date().toISOString().split('T')[0],
      status: 'pending',
    });
    setLineItems([{ item_name: '', qty: 1, price: 0 }]);
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { item_name: '', qty: 1, price: 0 }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.qty || 0) * (item.price || 0), 0);
  };

  // Stats calculations - MUST be before any conditional returns to avoid hooks violation
  const stats = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter(o => ['draft', 'confirmed'].includes(o.status)).length,
      processing: orders.filter(o => ['approved', 'in-packing', 'packed', 'loaded', 'in-delivery'].includes(o.status)).length,
      fulfilled: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
      totalRevenue: orders.reduce((sum, o) => sum + (parseFloat(String(o.total_amount)) || 0), 0),
    };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search filter
      const matchesSearch = (order.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toString().includes(searchQuery);
      
      // Status filter
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      
      // Date range filter
      const orderDate = new Date(order.order_date);
      const matchesStartDate = !startDate || orderDate >= startDate;
      const matchesEndDate = !endDate || orderDate <= endDate;
      
      return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
    });
  }, [orders, searchQuery, statusFilter, startDate, endDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading orders...</div>
      </div>
    );
  }

  return (
    <AppShell currentSuite="ops">
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.processing}</div>
            <p className="text-xs text-muted-foreground mt-1">In progress</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.fulfilled} fulfilled</p>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders Management</h1>
          <p className="text-muted-foreground mt-1">Manage customer orders and fulfillment</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="order_date">Order Date</Label>
                  <Input
                    id="order_date"
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: OrderStatus) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="fulfilled">Fulfilled</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label>Line Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {lineItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <Input
                          placeholder="Item name"
                          value={item.item_name}
                          onChange={(e) => updateLineItem(index, 'item_name', e.target.value)}
                        />
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          placeholder="Qty"
                          min="1"
                          value={item.qty}
                          onChange={(e) => updateLineItem(index, 'qty', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="w-28">
                        <Input
                          type="number"
                          placeholder="Price"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateLineItem(index, 'price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLineItem(index)}
                        disabled={lineItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <span className="font-semibold">Total:</span>
                  <span className="text-xl font-bold">${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrder} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Order'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Banner */}
      {error && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer or order #"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Start date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "End date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {(searchQuery || statusFilter !== 'all' || startDate || endDate) && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Showing {filteredOrders.length} of {orders.length} orders
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Orders List with Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-card/50 backdrop-blur">
          <TabsTrigger value="all">All Orders ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="processing">Processing ({stats.processing})</TabsTrigger>
          <TabsTrigger value="fulfilled">Fulfilled ({stats.fulfilled})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card className="bg-card/50 backdrop-blur">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {orders.length === 0 ? 'No orders yet. Create your first order to get started.' : 'No orders match your filters.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} onEdit={openEditModal} onDelete={handleDeleteOrder} onApprove={handleApproveOrder} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4">
            {filteredOrders.filter(o => o.status === 'draft' || o.status === 'confirmed').map((order) => (
              <OrderCard key={order.id} order={order} onEdit={openEditModal} onDelete={handleDeleteOrder} onApprove={handleApproveOrder} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          <div className="grid gap-4">
            {filteredOrders.filter(o => o.status === 'in-packing' || o.status === 'packed' || o.status === 'loaded').map((order) => (
              <OrderCard key={order.id} order={order} onEdit={openEditModal} onDelete={handleDeleteOrder} onApprove={handleApproveOrder} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="fulfilled" className="space-y-4">
          <div className="grid gap-4">
            {filteredOrders.filter(o => o.status === 'delivered').map((order) => (
              <OrderCard key={order.id} order={order} onEdit={openEditModal} onDelete={handleDeleteOrder} onApprove={handleApproveOrder} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Order #{editingOrder?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_customer_name">Customer Name</Label>
              <Input
                id="edit_customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="John Smith"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_order_date">Order Date</Label>
                <Input
                  id="edit_order_date"
                  type="date"
                  value={formData.order_date}
                  onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_status">Status</Label>
                <Select value={formData.status} onValueChange={(value: OrderStatus) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="fulfilled">Fulfilled</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label>Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input
                        placeholder="Item name"
                        value={item.item_name}
                        onChange={(e) => updateLineItem(index, 'item_name', e.target.value)}
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="Qty"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateLineItem(index, 'qty', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="w-28">
                      <Input
                        type="number"
                        placeholder="Price"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateLineItem(index, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(index)}
                      disabled={lineItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <span className="font-semibold">Total:</span>
                <span className="text-xl font-bold">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingOrder(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateOrder} disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </AppShell>
  );
}

// OrderCard Component
interface OrderCardProps {
  order: Order;
  onEdit: (order: Order) => void;
  onDelete: (orderId: number) => void;
  onApprove: (orderId: number) => void;
}

function OrderCard({ order, onEdit, onDelete, onApprove }: OrderCardProps) {
  return (
    <Card className="bg-card/50 backdrop-blur hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = '/directory';
                }}
                className="hover:text-primary hover:underline transition-colors text-left"
              >
                {order.customer_name}
              </button>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Order #{order.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[order.status]}>{order.status}</Badge>
            {(order.status === 'draft' || order.status === 'confirmed') && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => onApprove(order.id)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approve
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => onEdit(order)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(order.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order Date:</span>
            <span className="font-medium">{new Date(order.order_date).toLocaleDateString()}</span>
          </div>

          <div className="border-t pt-3">
            <p className="text-sm font-medium mb-2">Line Items:</p>
            <div className="space-y-1">
              {order.lineItems.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.quantity || item.qty || 0}x {item.productName || item.item_name || 'Unknown'}
                  </span>
                  <span className="font-medium">${(item.totalPrice || ((item.quantity || item.qty || 0) * (item.unitPrice || item.price || 0))).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between text-base font-semibold border-t pt-3">
            <span>Total:</span>
            <span>${parseFloat(String(order.total_amount)).toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
