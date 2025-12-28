import type { Request, Response } from 'express';

/**
 * DELETE /api/orders/:orderId
 * Delete an order
 */
export default async function handler(req: Request, res: Response) {
  try {
    const { orderId } = req.params;

    // Mock deletion - replace with actual database delete
    res.json({ 
      success: true,
      message: `Order ${orderId} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ 
      error: 'Failed to delete order',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
