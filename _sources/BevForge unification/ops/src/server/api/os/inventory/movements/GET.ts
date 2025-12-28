import type { Request, Response } from 'express';

/**
 * Mock OS API - Get Inventory Movements
 * 
 * Returns inventory movement history (receipts, shipments, adjustments, etc.)
 * 
 * Contract: Matches OS-API-CONTRACT.md specification
 */

// Mock movement data
const mockMovements = [
  {
    id: 'MOV-001',
    item_id: 'ITEM-001',
    item_name: 'Hoppy Trail IPA',
    movement_type: 'shipment',
    quantity: -50,
    unit_of_measure: 'liters',
    from_location_id: 'LOC-COLD-01',
    from_location_name: 'Cold Storage - Bay 1',
    to_location_id: null,
    to_location_name: null,
    reference_type: 'order',
    reference_id: 'ORD-001',
    batch_id: 'BATCH-2025-001',
    notes: 'Shipped to City Bar & Grill',
    created_by: 'system',
    created_at: '2025-12-25T14:00:00Z',
  },
  {
    id: 'MOV-002',
    item_id: 'ITEM-002',
    item_name: 'Golden Lager',
    movement_type: 'shipment',
    quantity: -100,
    unit_of_measure: 'liters',
    from_location_id: 'LOC-COLD-01',
    from_location_name: 'Cold Storage - Bay 1',
    to_location_id: null,
    to_location_name: null,
    reference_type: 'order',
    reference_id: 'ORD-002',
    batch_id: 'BATCH-2025-002',
    notes: 'Shipped to Downtown Pub',
    created_by: 'system',
    created_at: '2025-12-24T16:00:00Z',
  },
  {
    id: 'MOV-003',
    item_id: 'ITEM-001',
    item_name: 'Hoppy Trail IPA',
    movement_type: 'production',
    quantity: 950,
    unit_of_measure: 'liters',
    from_location_id: null,
    from_location_name: null,
    to_location_id: 'LOC-COLD-01',
    to_location_name: 'Cold Storage - Bay 1',
    reference_type: 'batch',
    reference_id: 'BATCH-2025-001',
    batch_id: 'BATCH-2025-001',
    notes: 'Batch completed and packaged',
    created_by: 'John Smith',
    created_at: '2025-12-15T10:00:00Z',
  },
  {
    id: 'MOV-004',
    item_id: 'ITEM-002',
    item_name: 'Golden Lager',
    movement_type: 'production',
    quantity: 1450,
    unit_of_measure: 'liters',
    from_location_id: null,
    from_location_name: null,
    to_location_id: 'LOC-COLD-01',
    to_location_name: 'Cold Storage - Bay 1',
    reference_type: 'batch',
    reference_id: 'BATCH-2025-002',
    batch_id: 'BATCH-2025-002',
    notes: 'Batch completed and packaged',
    created_by: 'Sarah Johnson',
    created_at: '2025-12-19T10:00:00Z',
  },
  {
    id: 'MOV-005',
    item_id: 'ITEM-003',
    item_name: 'Dark Night Stout',
    movement_type: 'production',
    quantity: 750,
    unit_of_measure: 'liters',
    from_location_id: null,
    from_location_name: null,
    to_location_id: 'LOC-COLD-02',
    to_location_name: 'Cold Storage - Bay 2',
    reference_type: 'batch',
    reference_id: 'BATCH-2025-003',
    batch_id: 'BATCH-2025-003',
    notes: 'Batch completed and packaged',
    created_by: 'Mike Davis',
    created_at: '2025-12-24T10:00:00Z',
  },
  {
    id: 'MOV-006',
    item_id: 'ITEM-101',
    item_name: 'Pale Malt (2-Row)',
    movement_type: 'receipt',
    quantity: 2000,
    unit_of_measure: 'kg',
    from_location_id: null,
    from_location_name: null,
    to_location_id: 'LOC-DRY-01',
    to_location_name: 'Dry Storage - Grain',
    reference_type: 'purchase_order',
    reference_id: 'PO-001',
    batch_id: null,
    notes: 'Received from supplier',
    created_by: 'warehouse',
    created_at: '2025-12-20T09:00:00Z',
  },
  {
    id: 'MOV-007',
    item_id: 'ITEM-003',
    item_name: 'Dark Night Stout',
    movement_type: 'adjustment',
    quantity: -10,
    unit_of_measure: 'liters',
    from_location_id: 'LOC-COLD-02',
    from_location_name: 'Cold Storage - Bay 2',
    to_location_id: null,
    to_location_name: null,
    reference_type: 'adjustment',
    reference_id: 'ADJ-001',
    batch_id: 'BATCH-2025-003',
    notes: 'Spillage during transfer',
    created_by: 'warehouse',
    created_at: '2025-12-24T11:00:00Z',
  },
];

export default async function handler(req: Request, res: Response) {
  try {
    const { item_id, movement_type, reference_id, start_date, end_date } = req.query;

    let filteredMovements = [...mockMovements];

    // Filter by item_id
    if (item_id) {
      filteredMovements = filteredMovements.filter(mov => mov.item_id === item_id);
    }

    // Filter by movement_type
    if (movement_type) {
      filteredMovements = filteredMovements.filter(mov => mov.movement_type === movement_type);
    }

    // Filter by reference_id
    if (reference_id) {
      filteredMovements = filteredMovements.filter(mov => mov.reference_id === reference_id);
    }

    // Filter by date range
    if (start_date) {
      const startDate = new Date(start_date as string);
      filteredMovements = filteredMovements.filter(
        mov => new Date(mov.created_at) >= startDate
      );
    }

    if (end_date) {
      const endDate = new Date(end_date as string);
      filteredMovements = filteredMovements.filter(
        mov => new Date(mov.created_at) <= endDate
      );
    }

    // Sort by created_at descending (newest first)
    filteredMovements.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    res.json({
      success: true,
      data: filteredMovements,
      meta: {
        total: filteredMovements.length,
        source: 'mock',
        message: 'Mock OS API - Replace with real OS when ready',
      },
    });
  } catch (error) {
    console.error('Error fetching movements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch movements',
    });
  }
}
