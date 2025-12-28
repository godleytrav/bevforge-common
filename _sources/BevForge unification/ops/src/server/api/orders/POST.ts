import type { Request, Response } from 'express';

/**
 * POST /api/orders
 * Create a new order
 */
export default async function handler(req: Request, res: Response) {
  try {
    const { customer_name, order_date, status, line_items, total } = req.body;

    // Validation
    if (!customer_name || !order_date || !line_items || line_items.length === 0) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'customer_name, order_date, and line_items are required'
      });
    }

    // Mock creation - replace with actual database insert
    const newOrder = {
      id: Math.floor(Math.random() * 10000),
      customer_name,
      order_date,
      status: status || 'pending',
      total: total || 0,
      line_items,
      created_at: new Date().toISOString(),
    };

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      error: 'Failed to create order',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
