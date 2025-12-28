import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { appSchema } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * PATCH /api/orders/:orderId
 * Update order details or status
 * 
 * Body can include:
 *   - status: Update order status
 *   - notes: Update order notes
 *   - delivery_date: Update delivery date
 */
export default async function handler(req: Request, res: Response) {
  try {
    const { orderId } = req.params;
    const updates = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Validate status if provided
    const validStatuses = [
      'draft',
      'confirmed',
      'approved',
      'in-packing',
      'packed',
      'loaded',
      'in-delivery',
      'delivered',
      'cancelled'
    ];

    if (updates.status && !validStatuses.includes(updates.status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses 
      });
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date(),
    };

    if (updates.status) {
      updateData.status = updates.status;
    }

    if (updates.notes !== undefined) {
      updateData.notes = updates.notes;
    }

    if (updates.delivery_date) {
      updateData.delivery_date = new Date(updates.delivery_date);
    }

    // Update order in database
    await db
      .update(appSchema.orders)
      .set(updateData)
      .where(eq(appSchema.orders.id, orderId));

    // Fetch updated order
    const updatedOrders = await db
      .select()
      .from(appSchema.orders)
      .where(eq(appSchema.orders.id, orderId))
      .limit(1);

    if (updatedOrders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log(`Order ${orderId} updated:`, updates);

    res.json({
      success: true,
      order: updatedOrders[0],
      message: `Order ${orderId} updated successfully`
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ 
      error: 'Failed to update order',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
