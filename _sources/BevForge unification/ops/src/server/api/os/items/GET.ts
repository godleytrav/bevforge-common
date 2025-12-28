import type { Request, Response } from 'express';

/**
 * Mock OS API - Get All Items (Products & Materials)
 * 
 * This is a MOCK endpoint that simulates the OS inventory system.
 * When OS is ready, replace this with a proxy to the real OS API.
 * 
 * Contract: Matches OS-API-CONTRACT.md specification
 */

// Mock inventory data
const mockItems = [
  // Finished Goods - Beers
  {
    id: 'ITEM-001',
    sku: 'HT-IPA-001',
    name: 'Hoppy Trail IPA',
    type: 'finished_good',
    category: 'beer',
    style: 'IPA',
    abv: 6.5,
    ibu: 65,
    srm: 8,
    description: 'A bold West Coast IPA with citrus and pine notes',
    unit_of_measure: 'liters',
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'ITEM-002',
    sku: 'GL-LAG-001',
    name: 'Golden Lager',
    type: 'finished_good',
    category: 'beer',
    style: 'Lager',
    abv: 4.8,
    ibu: 18,
    srm: 4,
    description: 'Crisp and refreshing golden lager',
    unit_of_measure: 'liters',
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'ITEM-003',
    sku: 'DN-STO-001',
    name: 'Dark Night Stout',
    type: 'finished_good',
    category: 'beer',
    style: 'Stout',
    abv: 7.2,
    ibu: 45,
    srm: 40,
    description: 'Rich imperial stout with chocolate and coffee notes',
    unit_of_measure: 'liters',
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'ITEM-004',
    sku: 'SM-PIL-001',
    name: 'Summer Pilsner',
    type: 'finished_good',
    category: 'beer',
    style: 'Pilsner',
    abv: 5.0,
    ibu: 32,
    srm: 3,
    description: 'Light and crisp Czech-style pilsner',
    unit_of_measure: 'liters',
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'ITEM-005',
    sku: 'HW-WIT-001',
    name: 'Hazy Wheat',
    type: 'finished_good',
    category: 'beer',
    style: 'Wheat Beer',
    abv: 5.2,
    ibu: 15,
    srm: 5,
    description: 'Unfiltered wheat beer with orange and coriander',
    unit_of_measure: 'liters',
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  
  // Raw Materials - Ingredients
  {
    id: 'ITEM-101',
    sku: 'MALT-PALE-001',
    name: 'Pale Malt (2-Row)',
    type: 'raw_material',
    category: 'grain',
    description: 'Base malt for most beer styles',
    unit_of_measure: 'kg',
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'ITEM-102',
    sku: 'HOPS-CAS-001',
    name: 'Cascade Hops',
    type: 'raw_material',
    category: 'hops',
    description: 'Classic American hop variety',
    unit_of_measure: 'kg',
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'ITEM-103',
    sku: 'YEAST-ALE-001',
    name: 'American Ale Yeast',
    type: 'raw_material',
    category: 'yeast',
    description: 'Clean fermenting ale yeast',
    unit_of_measure: 'units',
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  
  // Packaging Materials
  {
    id: 'ITEM-201',
    sku: 'KEG-50L-001',
    name: '50L Keg (Empty)',
    type: 'packaging',
    category: 'keg',
    description: 'Standard 50L stainless steel keg',
    unit_of_measure: 'units',
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'ITEM-202',
    sku: 'CAN-355ML-001',
    name: '355ml Can (Empty)',
    type: 'packaging',
    category: 'can',
    description: 'Standard 12oz aluminum can',
    unit_of_measure: 'units',
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'ITEM-203',
    sku: 'BOT-330ML-001',
    name: '330ml Bottle (Empty)',
    type: 'packaging',
    category: 'bottle',
    description: 'Standard 330ml glass bottle',
    unit_of_measure: 'units',
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

export default async function handler(req: Request, res: Response) {
  try {
    const { type, category, status, search } = req.query;

    let filteredItems = [...mockItems];

    // Filter by type
    if (type) {
      filteredItems = filteredItems.filter(item => item.type === type);
    }

    // Filter by category
    if (category) {
      filteredItems = filteredItems.filter(item => item.category === category);
    }

    // Filter by status
    if (status) {
      filteredItems = filteredItems.filter(item => item.status === status);
    }

    // Search by name or SKU
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filteredItems = filteredItems.filter(
        item =>
          item.name.toLowerCase().includes(searchLower) ||
          item.sku.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      success: true,
      data: filteredItems,
      meta: {
        total: filteredItems.length,
        source: 'mock',
        message: 'Mock OS API - Replace with real OS when ready',
      },
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch items',
    });
  }
}
