import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import InventoryTable from '@/components/InventoryTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, Filter, Download, Upload, Package, Beaker, Wheat, Hop, Apple, Wrench, Box, Beer, AlertTriangle } from 'lucide-react';

// Mock inventory data
const mockInventoryItems = [
  {
    id: 1,
    name: 'SafAle US-05',
    category: 'yeast',
    quantity: 45,
    unit: 'packs',
    reorderPoint: 10,
    trend: 'stable' as const,
    cost: 4.99,
  },
  {
    id: 2,
    name: 'Cascade Hops',
    category: 'hops',
    quantity: 85,
    unit: 'kg',
    reorderPoint: 50,
    trend: 'stable' as const,
    cost: 18.50,
  },
  {
    id: 3,
    name: 'Pilsner Malt',
    category: 'malt',
    quantity: 450,
    unit: 'kg',
    reorderPoint: 200,
    trend: 'down' as const,
    cost: 1.25,
  },
  {
    id: 4,
    name: 'Bottles - 500ml',
    category: 'packaging',
    quantity: 12500,
    unit: 'units',
    reorderPoint: 5000,
    trend: 'up' as const,
    cost: 0.35,
  },
  {
    id: 5,
    name: 'Crown Caps',
    category: 'packaging',
    quantity: 8,
    unit: 'units',
    reorderPoint: 2000,
    trend: 'down' as const,
    cost: 0.05,
  },
  {
    id: 6,
    name: 'WLP001 California Ale',
    category: 'yeast',
    quantity: 22,
    unit: 'vials',
    reorderPoint: 15,
    trend: 'stable' as const,
    cost: 8.99,
  },
  {
    id: 7,
    name: 'Centennial Hops',
    category: 'hops',
    quantity: 42,
    unit: 'kg',
    reorderPoint: 50,
    trend: 'down' as const,
    cost: 19.75,
  },
  {
    id: 8,
    name: 'Munich Malt',
    category: 'malt',
    quantity: 380,
    unit: 'kg',
    reorderPoint: 150,
    trend: 'stable' as const,
    cost: 1.45,
  },
];

export default function InventoryManagementPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);

  const categories = [
    { id: 'yeast', name: 'Yeast', icon: Beaker, description: 'Ale, lager, wine yeast', isIngredient: true },
    { id: 'malt', name: 'Malt & Grain', icon: Wheat, description: 'Base, specialty, adjunct', isIngredient: true },
    { id: 'hops', name: 'Hops', icon: Hop, description: 'Bittering, aroma, dual-purpose', isIngredient: true },
    { id: 'fruit', name: 'Fruit & Adjuncts', icon: Apple, description: 'Fruit, spices, additives', isIngredient: true },
    { id: 'equipment', name: 'Equipment', icon: Wrench, description: 'Tools, parts, supplies', isIngredient: false },
    { id: 'packaging', name: 'Packaging', icon: Box, description: 'Bottles, caps, labels', isIngredient: false },
    { id: 'kegs', name: 'Kegs & Barrels', icon: Beer, description: 'Kegs, casks, barrels', isIngredient: false },
  ];

  const handleCategorySelect = (categoryId: string) => {
    setShowAddItemDialog(false);
    navigate(`/os/inventory/add?category=${categoryId}`);
  };

  const handleExport = () => {
    // TODO: Export inventory to CSV
    console.log('Exporting inventory...');
  };

  const handleImport = () => {
    // TODO: Import inventory from CSV
    console.log('Importing inventory...');
  };

  // Filter items based on search and category
  const filteredItems = mockInventoryItems.filter((item) => {
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Calculate stats
  const totalItems = mockInventoryItems.length;
  const lowStockItems = mockInventoryItems.filter(item => item.quantity <= item.reorderPoint).length;
  const totalValue = mockInventoryItems.reduce((sum, item) => sum + (item.cost || 0) * item.quantity, 0);

  return (
    <AppShell currentSuite="os" pageTitle="Inventory Management">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage all brewery inventory items
            </p>
          </div>
          <Button onClick={() => setShowAddItemDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{totalItems}</div>
                  <p className="text-sm text-muted-foreground">Total Items</p>
                </div>
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-yellow-500">{lowStockItems}</div>
                  <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-500">${totalValue.toFixed(0)}</div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                </div>
                <Package className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{filteredItems.length}</div>
                  <p className="text-sm text-muted-foreground">Filtered Results</p>
                </div>
                <Filter className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Search and filter inventory items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, code, or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="w-full md:w-64">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="yeast">Yeast</SelectItem>
                    <SelectItem value="malt">Malt & Grain</SelectItem>
                    <SelectItem value="hops">Hops</SelectItem>
                    <SelectItem value="fruit">Fruit & Adjuncts</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="packaging">Packaging</SelectItem>
                    <SelectItem value="kegs">Kegs & Barrels</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExport} className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" onClick={handleImport} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
            <CardDescription>
              {filteredItems.length} items {searchQuery || categoryFilter !== 'all' ? '(filtered)' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <InventoryTable items={filteredItems} />
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
