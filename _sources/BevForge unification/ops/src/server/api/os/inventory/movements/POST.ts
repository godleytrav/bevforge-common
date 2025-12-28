import type { Request, Response } from 'express';

/**
 * Mock OS API - Create Inventory Movement
 * 
 * Records a new inventory movement (shipment, receipt, adjustment, etc.)
 * In the real OS, this would update the inventory ledger.
 * 
 * Contract: Matches OS-API-CONTRACT.md specification
 */

export default async function handler(req: Request, res: Response) {
  try {
    const {
      item_id,
      movement_type,
      quantity,
      from_location_id,
      to_location_id,
      reference_type,
      reference_id,
      batch_id,
      notes,
    } = req.body;

    // Validate required fields
    if (!item_id || !movement_type || !quantity) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: item_id, movement_type, quantity',
      });
    }

    // Validate movement_type
    const validTypes = ['receipt', 'shipment', 'transfer', 'adjustment', 'production', 'consumption'];
    if (!validTypes.includes(movement_type)) {
      return res.status(400).json({
        success: false,
        error: `Invalid movement_type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    // Mock: Create movement record
    const movement = {
      id: `MOV-${Date.now()}`,
      item_id,
      movement_type,
      quantity: parseFloat(quantity),
      unit_of_measure: 'liters', // Would be looked up from item
      from_location_id: from_location_id || null,
      from_location_name: from_location_id ? 'Location Name' : null,
      to_location_id: to_location_id || null,
      to_location_name: to_location_id ? 'Location Name' : null,
      reference_type: reference_type || null,
      reference_id: reference_id || null,
      batch_id: batch_id || null,
      notes: notes || '',
      created_by: 'system',
      created_at: new Date().toISOString(),
    };

    console.log('Mock OS: Created inventory movement:', movement);

    // In real OS, this would:
    // 1. Insert into inventory_ledger table
    // 2. Update inventory on-hand quantities
    // 3. Update allocated quantities if needed
    // 4. Trigger any business rules (low stock alerts, etc.)

    res.status(201).json({
      success: true,
      data: movement,
      meta: {
        source: 'mock',
        message: 'Mock OS API - Movement recorded in memory only. Replace with real OS when ready.',
      },
    });
  } catch (error) {
    console.error('Error creating movement:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create movement',
    });
  }
}
