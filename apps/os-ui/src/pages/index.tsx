import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import MetricCard from '@/components/MetricCard';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  Package,
  Monitor,
  Plus,
  Beaker,
  Wheat,
  Hop,
  Apple,
  Wrench,
  Box,
  Beer,
  Gauge,
  ArrowRight,
  LayoutGrid,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);

  const categories = [
    {
      id: 'yeast',
      name: 'Yeast',
      icon: Beaker,
      description: 'Ale, lager, wine yeast',
      isIngredient: true,
    },
    {
      id: 'malt',
      name: 'Malt & Grain',
      icon: Wheat,
      description: 'Base, specialty, adjunct',
      isIngredient: true,
    },
    {
      id: 'hops',
      name: 'Hops',
      icon: Hop,
      description: 'Bittering, aroma, dual-purpose',
      isIngredient: true,
    },
    {
      id: 'fruit',
      name: 'Fruit & Adjuncts',
      icon: Apple,
      description: 'Fruit, spices, additives',
      isIngredient: true,
    },
    {
      id: 'equipment',
      name: 'Equipment',
      icon: Wrench,
      description: 'Tools, parts, supplies',
      isIngredient: false,
    },
    {
      id: 'packaging',
      name: 'Packaging',
      icon: Box,
      description: 'Bottles, caps, labels',
      isIngredient: false,
    },
    {
      id: 'kegs',
      name: 'Kegs & Barrels',
      icon: Beer,
      description: 'Kegs, casks, barrels',
      isIngredient: false,
    },
  ];

  const handleCategorySelect = (categoryId: string) => {
    setShowAddItemDialog(false);
    navigate(`/os/inventory/add?category=${categoryId}`);
  };

  return (
    <AppShell currentSuite="os" pageTitle="OS Dashboard">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">OS Dashboard</h1>
            <p className="text-muted-foreground">
              Operating System - Inventory, Batches & Production Tracking
            </p>
          </div>
          <Button
            onClick={() => navigate('/os/control-panel')}
            className="gap-2"
            size="lg"
          >
            <Monitor className="h-5 w-5" />
            Open Control Panel
          </Button>
        </div>

        {/* System Status Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">System Operational</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <span className="text-xs text-muted-foreground font-mono">
                  Uptime: 47d 12h 34m
                </span>
                <div className="h-4 w-px bg-border" />
                <span className="text-xs text-muted-foreground font-mono">
                  Last Sync: 2 minutes ago
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-xs text-muted-foreground">3 warnings require attention</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Active Devices"
            value={8}
            unit="devices"
            icon={Activity}
            status="operational"
            change={{ value: 2, label: 'from last week' }}
          />
          <MetricCard
            title="Inventory Items"
            value={247}
            unit="items"
            icon={Package}
            status="info"
            change={{ value: 12, label: 'from last week' }}
          />
          <MetricCard
            title="System Warnings"
            value={3}
            unit="alerts"
            icon={AlertTriangle}
            status="warning"
          />
          <MetricCard
            title="Production Rate"
            value="94.2"
            unit="%"
            icon={TrendingUp}
            status="operational"
            change={{ value: 3.2, label: 'from last month' }}
          />
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Device Canvas Card */}
          <Card className="hover:shadow-glow-lg transition-shadow cursor-pointer" onClick={() => navigate('/os/devices')}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <LayoutGrid className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Device Layout</CardTitle>
                    <CardDescription>Configure brewery equipment</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Design and configure your brewery device layout, connections, and flow paths.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">8 devices online</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Control Panel ready</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Card */}
          <Card className="hover:shadow-glow-lg transition-shadow cursor-pointer" onClick={() => navigate('/os/inventory')}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Package className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Inventory Management</CardTitle>
                    <CardDescription>Track all brewery materials</CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manage ingredients, equipment, packaging, and track inventory levels across all locations.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">247 items tracked</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-yellow-500">12 low stock</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common operations and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 p-4"
                onClick={() => setShowAddItemDialog(true)}
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs">Add Item</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 p-4"
                onClick={() => navigate('/os/batches/new')}
              >
                <Beer className="h-5 w-5" />
                <span className="text-xs">New Batch</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 p-4"
                onClick={() => navigate('/os/inventory')}
              >
                <Package className="h-5 w-5" />
                <span className="text-xs">View Inventory</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 p-4"
                onClick={() => navigate('/os/devices')}
              >
                <LayoutGrid className="h-5 w-5" />
                <span className="text-xs">Edit Layout</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 p-4"
                onClick={() => navigate('/os/control-panel')}
              >
                <Gauge className="h-5 w-5" />
                <span className="text-xs">Control Panel</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 p-4"
                onClick={() => console.log('Record movement')}
              >
                <TrendingUp className="h-5 w-5" />
                <span className="text-xs">Record Movement</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Batches */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Batches</CardTitle>
              <CardDescription>Latest production runs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 'B-2024-045', name: 'West Coast IPA', status: 'fermenting', progress: 65 },
                  { id: 'B-2024-044', name: 'Belgian Dubbel', status: 'conditioning', progress: 85 },
                  { id: 'B-2024-043', name: 'Pilsner', status: 'packaging', progress: 95 },
                ].map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-muted-foreground">{batch.id}</span>
                        <span className="text-sm font-medium">{batch.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${batch.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{batch.progress}%</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/os/batches/${batch.id}`)}>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alerts</CardTitle>
              <CardDescription>Items requiring reorder</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'SafAle US-05', quantity: 8, unit: 'packs', reorder: 10 },
                  { name: 'Cascade Hops', quantity: 42, unit: 'kg', reorder: 50 },
                  { name: 'Bottle Caps', quantity: 450, unit: 'units', reorder: 500 },
                  { name: 'Sanitizer', quantity: 2, unit: 'gallons', reorder: 5 },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.quantity} {item.unit} (reorder at {item.reorder})
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Reorder
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle>System Integration</CardTitle>
            <CardDescription>Module connectivity status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <div className="font-medium text-sm">API Connected</div>
                  <div className="text-xs text-muted-foreground">All endpoints operational</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <div className="font-medium text-sm">Database Synced</div>
                  <div className="text-xs text-muted-foreground">Last sync: 2 min ago</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="font-medium text-sm">OPS Integration</div>
                  <div className="text-xs text-muted-foreground">Pending configuration</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Item Category Dialog */}
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
            <DialogDescription>
              Select the type of item you want to add
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors text-left"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                    {category.isIngredient && (
                      <span className="inline-block mt-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        LAB-Tracked
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
