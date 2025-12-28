import type { Request, Response } from 'express';
import { db } from '../../../db/client.js';
import { appSchema } from '../../../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * GET /api/orders/:orderId
 * Fetch a single order with full details including customer, line items, and products
 */
export default async function handler(req: Request, res: Response) {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Fetch order
    const orders = await db
      .select()
      .from(appSchema.orders)
      .where(eq(appSchema.orders.id, orderId))
      .limit(1);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orders[0];

    // Fetch customer (location)
    let customer = null;
    if (order.location_id) {
      const customers = await db
        .select()
        .from(appSchema.locations)
        .where(eq(appSchema.locations.id, order.location_id))
        .limit(1);
      
      if (customers.length > 0) {
        customer = customers[0];
      }
    }

    // Fetch line items
    const lineItems = await db
      .select()
      .from(appSchema.orderLineItems)
      .where(eq(appSchema.orderLineItems.order_id, orderId));

    // Fetch product details for each line item
    const lineItemsWithProducts = await Promise.all(
      lineItems.map(async (item) => {
        let product = null;
        let containerType = null;

        if (item.product_id) {
          const products = await db
            .select()
            .from(appSchema.products)
            .where(eq(appSchema.products.id, item.product_id))
            .limit(1);
          
          if (products.length > 0) {
            product = products[0];
          }
        }

        if (item.container_type_id) {
          const containerTypes = await db
            .select()
            .from(appSchema.containerTypes)
            .where(eq(appSchema.containerTypes.id, item.container_type_id))
            .limit(1);
          
          if (containerTypes.length > 0) {
            containerType = containerTypes[0];
          }
        }

        return {
          ...item,
          product,
          containerType,
        };
      })
    );

    // Build response
    const orderWithDetails = {
      ...order,
      customer,
      lineItems: lineItemsWithProducts,
    };

    res.json(orderWithDetails);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ 
      error: 'Failed to fetch order',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
