/**
 * OrderService — handles order creation, retrieval, and status updates.
 * Depends on UserService to validate the requesting user.
 */

const { getUser, isUserActive } = require("./userService");

const orderStore = new Map();
let nextOrderId = 1000;

/**
 * Creates a new order for a user.
 *
 * @param {string} userId
 * @param {Array<{ productId: string, quantity: number, unitPrice: number }>} items
 * @returns {{ id: string, userId: string, items: Array, total: number, status: string, createdAt: string }}
 */
function createOrder(userId, items) {
  if (!isUserActive(userId)) {
    throw new Error(`User ${userId} is not active`);
  }

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const order = {
    id: `ord-${nextOrderId++}`,
    userId,
    items,
    total,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  orderStore.set(order.id, order);
  return order;
}

/**
 * Retrieves an order by ID.
 *
 * @param {string} orderId
 * @returns {Object | null}
 */
function getOrder(orderId) {
  return orderStore.get(orderId) ?? null;
}

/**
 * Updates the status of an existing order.
 *
 * @param {string} orderId
 * @param {"pending" | "confirmed" | "shipped" | "cancelled"} newStatus
 * @returns {Object | null}
 */
function updateOrderStatus(orderId, newStatus) {
  const order = orderStore.get(orderId);
  if (!order) return null;
  order.status = newStatus;
  return order;
}

module.exports = { createOrder, getOrder, updateOrderStatus };
