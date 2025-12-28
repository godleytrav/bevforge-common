import type { Request, Response } from 'express';

/**
 * Mock OS API - Get Batches
 * 
 * Returns production batch information with traceability data.
 * 
 * Contract: Matches OS-API-CONTRACT.md specification
 */

// Mock batch data
const mockBatches = [
  {
    id: 'BATCH-2025-001',
    batch_number: 'BATCH-2025-001',
    item_id: 'ITEM-001',
    item_name: 'Hoppy Trail IPA',
    brew_date: '2025-12-01T08:00:00Z',
    package_date: '2025-12-15T10:00:00Z',
    best_by_date: '2026-03-15T00:00:00Z',
    batch_size: 1000,
    yield_actual: 950,
    yield_expected: 1000,
    unit_of_measure: 'liters',
    status: 'completed',
    brewer_name: 'John Smith',
    quality_status: 'passed',
    notes: 'Excellent fermentation, slight loss during transfer',
    created_at: '2025-12-01T08:00:00Z',
    updated_at: '2025-12-15T10:00:00Z',
  },
  {
    id: 'BATCH-2025-002',
    batch_number: 'BATCH-2025-002',
    item_id: 'ITEM-002',
    item_name: 'Golden Lager',
    brew_date: '2025-12-05T08:00:00Z',
    package_date: '2025-12-19T10:00:00Z',
    best_by_date: '2026-04-19T00:00:00Z',
    batch_size: 1500,
    yield_actual: 1450,
    yield_expected: 1500,
    unit_of_measure: 'liters',
    status: 'completed',
    brewer_name: 'Sarah Johnson',
    quality_status: 'passed',
    notes: 'Clean fermentation, good clarity',
    created_at: '2025-12-05T08:00:00Z',
    updated_at: '2025-12-19T10:00:00Z',
  },
  {
    id: 'BATCH-2025-003',
    batch_number: 'BATCH-2025-003',
    item_id: 'ITEM-003',
    item_name: 'Dark Night Stout',
    brew_date: '2025-12-10T08:00:00Z',
    package_date: '2025-12-24T10:00:00Z',
    best_by_date: '2026-06-24T00:00:00Z',
    batch_size: 800,
    yield_actual: 750,
    yield_expected: 800,
    unit_of_measure: 'liters',
    status: 'completed',
    brewer_name: 'Mike Davis',
    quality_status: 'passed',
    notes: 'Rich flavor profile, extended conditioning',
    created_at: '2025-12-10T08:00:00Z',
    updated_at: '2025-12-24T10:00:00Z',
  },
  {
    id: 'BATCH-2025-004',
    batch_number: 'BATCH-2025-004',
    item_id: 'ITEM-004',
    item_name: 'Summer Pilsner',
    brew_date: '2025-12-15T08:00:00Z',
    package_date: null,
    best_by_date: null,
    batch_size: 1200,
    yield_actual: null,
    yield_expected: 1200,
    unit_of_measure: 'liters',
    status: 'fermenting',
    brewer_name: 'John Smith',
    quality_status: 'pending',
    notes: 'Currently in fermentation tank 3',
    created_at: '2025-12-15T08:00:00Z',
    updated_at: '2025-12-26T08:00:00Z',
  },
  {
    id: 'BATCH-2025-005',
    batch_number: 'BATCH-2025-005',
    item_id: 'ITEM-005',
    item_name: 'Hazy Wheat',
    brew_date: '2025-12-18T08:00:00Z',
    package_date: null,
    best_by_date: null,
    batch_size: 1000,
    yield_actual: null,
    yield_expected: 1000,
    unit_of_measure: 'liters',
    status: 'brewing',
    brewer_name: 'Sarah Johnson',
    quality_status: 'pending',
    notes: 'Mash in progress',
    created_at: '2025-12-18T08:00:00Z',
    updated_at: '2025-12-26T08:00:00Z',
  },
];

export default async function handler(req: Request, res: Response) {
  try {
    const { item_id, status, batch_number } = req.query;

    let filteredBatches = [...mockBatches];

    // Filter by item_id
    if (item_id) {
      filteredBatches = filteredBatches.filter(batch => batch.item_id === item_id);
    }

    // Filter by status
    if (status) {
      filteredBatches = filteredBatches.filter(batch => batch.status === status);
    }

    // Filter by batch_number
    if (batch_number) {
      filteredBatches = filteredBatches.filter(batch => batch.batch_number === batch_number);
    }

    // Sort by brew_date descending (newest first)
    filteredBatches.sort((a, b) => 
      new Date(b.brew_date).getTime() - new Date(a.brew_date).getTime()
    );

    res.json({
      success: true,
      data: filteredBatches,
      meta: {
        total: filteredBatches.length,
        source: 'mock',
        message: 'Mock OS API - Replace with real OS when ready',
      },
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch batches',
    });
  }
}
