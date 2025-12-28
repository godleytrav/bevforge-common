import type { Request, Response } from 'express';

/**
 * Mock OS API - Get Inventory On-Hand
 * 
 * Returns current stock levels for all items or specific item.
 * Includes quantity, location, and lot information.
 * 
 * Contract: Matches OS-API-CONTRACT.md specification
 */

// Mock inventory on-hand data
const mockInventory = [
  // Finished Goods Inventory
  {
    item_id: 'ITEM-001', // Hoppy Trail IPA
    sku: 'HT-IPA-001',
    name: 'Hoppy Trail IPA',
    quantity_on_hand: 500,
    quantity_available: 450,
    quantity_allocated: 50,
    unit_of_measure: 'liters',
    location_id: 'LOC-COLD-01',
    location_name: 'Cold Storage - Bay 1',
    last_counted_at: '2025-12-20T10:00:00Z',
    updated_at: '2025-12-26T08:00:00Z',
  },
  {
    item_id: 'ITEM-002', // Golden Lager
    sku: 'GL-LAG-001',
    name: 'Golden Lager',
    quantity_on_hand: 750,
    quantity_available: 700,
    quantity_allocated: 50,
    unit_of_measure: 'liters',
    location_id: 'LOC-COLD-01',
    location_name: 'Cold Storage - Bay 1',
    last_counted_at: '2025-12-20T10:00:00Z',
    updated_at: '2025-12-26T08:00:00Z',
  },
  {
    item_id: 'ITEM-003', // Dark Night Stout
    sku: 'DN-STO-001',
    name: 'Dark Night Stout',
    quantity_on_hand: 300,
    quantity_available: 250,
    quantity_allocated: 50,
    unit_of_measure: 'liters',
    location_id: 'LOC-COLD-02',
    location_name: 'Cold Storage - Bay 2',
    last_counted_at: '2025-12-20T10:00:00Z',
    updated_at: '2025-12-26T08:00:00Z',
  },
  {
    item_id: 'ITEM-004', // Summer Pilsner
    sku: 'SM-PIL-001',
    name: 'Summer Pilsner',
    quantity_on_hand: 600,
    quantity_available: 600,
    quantity_allocated: 0,
    unit_of_measure: 'liters',
    location_id: 'LOC-COLD-01',
    location_name: 'Cold Storage - Bay 1',
    last_counted_at: '2025-12-20T10:00:00Z',
    updated_at: '2025-12-26T08:00:00Z',
  },
  {
    item_id: 'ITEM-005', // Hazy Wheat
    sku: 'HW-WIT-001',
    name: 'Hazy Wheat',
    quantity_on_hand: 400,
    quantity_available: 400,
    quantity_allocated: 0,
    unit_of_measure: 'liters',
    location_id: 'LOC-COLD-02',
    location_name: 'Cold Storage - Bay 2',
    last_counted_at: '2025-12-20T10:00:00Z',
    updated_at: '2025-12-26T08:00:00Z',
  },
  
  // Raw Materials Inventory
  {
    item_id: 'ITEM-101', // Pale Malt
    sku: 'MALT-PALE-001',
    name: 'Pale Malt (2-Row)',
    quantity_on_hand: 5000,
    quantity_available: 4500,
    quantity_allocated: 500,
    unit_of_measure: 'kg',
    location_id: 'LOC-DRY-01',
    location_name: 'Dry Storage - Grain',
    last_counted_at: '2025-12-20T10:00:00Z',
    updated_at: '2025-12-26T08:00:00Z',
  },
  {
    item_id: 'ITEM-102', // Cascade Hops
    sku: 'HOPS-CAS-001',
    name: 'Cascade Hops',
    quantity_on_hand: 50,
    quantity_available: 40,
    quantity_allocated: 10,
    unit_of_measure: 'kg',
    location_id: 'LOC-COLD-03',
    location_name: 'Cold Storage - Hops',
    last_counted_at: '2025-12-20T10:00:00Z',
    updated_at: '2025-12-26T08:00:00Z',
  },
  {
    item_id: 'ITEM-103', // American Ale Yeast
    sku: 'YEAST-ALE-001',
    name: 'American Ale Yeast',
    quantity_on_hand: 100,
    quantity_available: 90,
    quantity_allocated: 10,
    unit_of_measure: 'units',
    location_id: 'LOC-COLD-03',
    location_name: 'Cold Storage - Yeast',
    last_counted_at: '2025-12-20T10:00:00Z',
    updated_at: '2025-12-26T08:00:00Z',
  },
  
  // Packaging Materials Inventory
  {
    item_id: 'ITEM-201', // 50L Kegs
    sku: 'KEG-50L-001',
    name: '50L Keg (Empty)',
    quantity_on_hand: 200,
    quantity_available: 150,
    quantity_allocated: 50,
    unit_of_measure: 'units',
    location_id: 'LOC-PKG-01',
    location_name: 'Packaging Storage',
    last_counted_at: '2025-12-20T10:00:00Z',
    updated_at: '2025-12-26T08:00:00Z',
  },
  {
    item_id: 'ITEM-202', // 355ml Cans
    sku: 'CAN-355ML-001',
    name: '355ml Can (Empty)',
    quantity_on_hand: 50000,
    quantity_available: 45000,
    quantity_allocated: 5000,
    unit_of_measure: 'units',
    location_id: 'LOC-PKG-01',
    location_name: 'Packaging Storage',
    last_counted_at: '2025-12-20T10:00:00Z',
    updated_at: '2025-12-26T08:00:00Z',
  },
  {
    item_id: 'ITEM-203', // 330ml Bottles
    sku: 'BOT-330ML-001',
    name: '330ml Bottle (Empty)',
    quantity_on_hand: 30000,
    quantity_available: 28000,
    quantity_allocated: 2000,
    unit_of_measure: 'units',
    location_id: 'LOC-PKG-01',
    location_name: 'Packaging Storage',
    last_counted_at: '2025-12-20T10:00:00Z',
    updated_at: '2025-12-26T08:00:00Z',
  },
];

export default async function handler(req: Request, res: Response) {
  try {
    const { item_id, location_id, low_stock } = req.query;

    let filteredInventory = [...mockInventory];

    // Filter by item_id
    if (item_id) {
      filteredInventory = filteredInventory.filter(inv => inv.item_id === item_id);
    }

    // Filter by location_id
    if (location_id) {
      filteredInventory = filteredInventory.filter(inv => inv.location_id === location_id);
    }

    // Filter for low stock (available < 100 for finished goods)
    if (low_stock === 'true') {
      filteredInventory = filteredInventory.filter(
        inv => inv.quantity_available < 100 && inv.item_id.startsWith('ITEM-00')
      );
    }

    // Calculate summary
    const summary = {
      total_items: filteredInventory.length,
      total_value_estimate: filteredInventory.reduce((sum, inv) => {
        // Rough estimate: $5/liter for beer, $2/kg for materials, $50/keg
        let unitValue = 5;
        if (inv.unit_of_measure === 'kg') unitValue = 2;
        if (inv.unit_of_measure === 'units' && inv.sku.includes('KEG')) unitValue = 50;
        if (inv.unit_of_measure === 'units' && inv.sku.includes('CAN')) unitValue = 0.5;
        if (inv.unit_of_measure === 'units' && inv.sku.includes('BOT')) unitValue = 0.6;
        return sum + inv.quantity_on_hand * unitValue;
      }, 0),
      low_stock_items: mockInventory.filter(
        inv => inv.quantity_available < 100 && inv.item_id.startsWith('ITEM-00')
      ).length,
    };

    res.json({
      success: true,
      data: filteredInventory,
      summary,
      meta: {
        total: filteredInventory.length,
        source: 'mock',
        message: 'Mock OS API - Replace with real OS when ready',
      },
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory',
    });
  }
}
