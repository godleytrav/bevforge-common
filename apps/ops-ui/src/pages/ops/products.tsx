import { useState } from 'react';
import { Package, Plus, Search, Filter, Edit, Trash2, Image as ImageIcon, DollarSign, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  type: string;
  abv: number;
  volume: number;
  unit: string;
  basePrice: number;
  wholesalePrice: number;
  retailPrice: number;
  status: 'active' | 'inactive' | 'discontinued';
  stock: number;
  reorderPoint: number;
  imageUrl?: string;
  description: string;
  variants: ProductVariant[];
}

interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  size: string;
  price: number;
  stock: number;
}

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Mock data
  const products: Product[] = [
    {
      id: '1',
      sku: 'IPA-001',
      name: 'Hoppy Trail IPA',
      category: 'Beer',
      type: 'IPA',
      abv: 6.5,
      volume: 16,
      unit: 'oz',
      basePrice: 3.50,
      wholesalePrice: 5.00,
      retailPrice: 7.99,
      status: 'active',
      stock: 2400,
      reorderPoint: 500,
      description: 'A bold West Coast IPA with citrus and pine notes',
      variants: [
        { id: 'v1', name: '6-Pack', sku: 'IPA-001-6PK', size: '6x16oz', price: 42.00, stock: 400 },
        { id: 'v2', name: 'Case', sku: 'IPA-001-CS', size: '24x16oz', price: 160.00, stock: 100 },
      ],
    },
    {
      id: '2',
      sku: 'LAGER-001',
      name: 'Golden Sunset Lager',
      category: 'Beer',
      type: 'Lager',
      abv: 4.8,
      volume: 12,
      unit: 'oz',
      basePrice: 2.75,
      wholesalePrice: 4.00,
      retailPrice: 6.49,
      status: 'active',
      stock: 3600,
      reorderPoint: 800,
      description: 'Crisp and refreshing German-style lager',
      variants: [
        { id: 'v3', name: '6-Pack', sku: 'LAGER-001-6PK', size: '6x12oz', price: 36.00, stock: 600 },
      ],
    },
    {
      id: '3',
      sku: 'STOUT-001',
      name: 'Midnight Stout',
      category: 'Beer',
      type: 'Stout',
      abv: 8.2,
      volume: 16,
      unit: 'oz',
      basePrice: 4.25,
      wholesalePrice: 6.00,
      retailPrice: 9.99,
      status: 'active',
      stock: 1200,
      reorderPoint: 300,
      description: 'Rich imperial stout with coffee and chocolate notes',
      variants: [
        { id: 'v4', name: '4-Pack', sku: 'STOUT-001-4PK', size: '4x16oz', price: 36.00, stock: 300 },
      ],
    },
    {
      id: '4',
      sku: 'SELTZER-001',
      name: 'Citrus Burst Seltzer',
      category: 'Seltzer',
      type: 'Hard Seltzer',
      abv: 5.0,
      volume: 12,
      unit: 'oz',
      basePrice: 2.50,
      wholesalePrice: 3.50,
      retailPrice: 5.99,
      status: 'active',
      stock: 4800,
      reorderPoint: 1000,
      description: 'Light and refreshing citrus hard seltzer',
      variants: [
        { id: 'v5', name: '12-Pack', sku: 'SELTZER-001-12PK', size: '12x12oz', price: 66.00, stock: 400 },
      ],
    },
  ];

  const categories = ['all', 'Beer', 'Seltzer', 'Cider', 'Wine', 'Spirits'];

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-yellow-500';
      case 'discontinued':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Catalog</h1>
          <p className="text-muted-foreground">Manage SKUs, pricing, and product variants</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>Create a new product with SKU and pricing information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" placeholder="IPA-001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" placeholder="Hoppy Trail IPA" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beer">Beer</SelectItem>
                      <SelectItem value="seltzer">Seltzer</SelectItem>
                      <SelectItem value="cider">Cider</SelectItem>
                      <SelectItem value="wine">Wine</SelectItem>
                      <SelectItem value="spirits">Spirits</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input id="type" placeholder="IPA, Lager, etc." />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="abv">ABV (%)</Label>
                  <Input id="abv" type="number" step="0.1" placeholder="6.5" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="volume">Volume</Label>
                  <Input id="volume" type="number" placeholder="16" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select>
                    <SelectTrigger id="unit">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oz">oz</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Product description..." rows={3} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Base Price</Label>
                  <Input id="basePrice" type="number" step="0.01" placeholder="3.50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wholesalePrice">Wholesale Price</Label>
                  <Input id="wholesalePrice" type="number" step="0.01" placeholder="5.00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retailPrice">Retail Price</Label>
                  <Input id="retailPrice" type="number" step="0.01" placeholder="7.99" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Initial Stock</Label>
                  <Input id="stock" type="number" placeholder="1000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorderPoint">Reorder Point</Label>
                  <Input id="reorderPoint" type="number" placeholder="200" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddDialogOpen(false)}>Create Product</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Active SKUs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Variants</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.reduce((sum, p) => sum + p.variants.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Package configurations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Retail Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(products.reduce((sum, p) => sum + p.retailPrice, 0) / products.length).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Per unit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter((p) => p.stock <= p.reorderPoint).length}
            </div>
            <p className="text-xs text-muted-foreground">Need reorder</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products or SKUs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="relative h-48 bg-muted flex items-center justify-center">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-16 w-16 text-muted-foreground" />
              )}
              <Badge className={`absolute top-2 right-2 ${getStatusColor(product.status)}`}>
                {product.status}
              </Badge>
            </div>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription>
                    {product.sku} • {product.type}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">ABV:</span>
                  <span className="ml-1 font-medium">{product.abv}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Size:</span>
                  <span className="ml-1 font-medium">
                    {product.volume}
                    {product.unit}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Stock:</span>
                  <span className="ml-1 font-medium">{product.stock.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Variants:</span>
                  <span className="ml-1 font-medium">{product.variants.length}</span>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Base Price:</span>
                  <span className="font-medium">${product.basePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Wholesale:</span>
                  <span className="font-medium">${product.wholesalePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Retail:</span>
                  <span className="font-semibold text-primary">${product.retailPrice.toFixed(2)}</span>
                </div>
              </div>

              {product.variants.length > 0 && (
                <div className="space-y-2 border-t pt-4">
                  <p className="text-sm font-medium">Package Variants:</p>
                  {product.variants.map((variant) => (
                    <div key={variant.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {variant.name} ({variant.size})
                      </span>
                      <span className="font-medium">${variant.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No products found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
