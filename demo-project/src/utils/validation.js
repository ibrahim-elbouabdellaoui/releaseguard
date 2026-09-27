/**
 * Validation utilities — input sanitisation helpers used across API handlers.
 */

/**
 * Validates a user ID string (must be alphanumeric with hyphens, 3–20 chars).
 *
 * @param {unknown} value
 * @returns {string} validated userId
 * @throws {Error} if invalid
 */
function validateUserId(value) {
  if (typeof value !== "string" || !/^[a-z0-9-]{3,20}$/.test(value)) {
    throw new Error("Invalid userId format");
  }
  return value;
}

/**
 * Validates an order item array.
 * Each item must have productId (string), quantity (positive int), unitPrice (positive number).
 *
 * @param {unknown} items
 * @returns {Array<{ productId: string, quantity: number, unitPrice: number }>}
 * @throws {Error} if invalid
 */
function validateOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  return items.map((item, index) => {
    if (typeof item.productId !== "string" || !item.productId) {
      throw new Error(`Item ${index}: missing productId`);
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new Error(`Item ${index}: quantity must be a positive integer`);
    }
    if (typeof item.unitPrice !== "number" || item.unitPrice <= 0) {
      throw new Error(`Item ${index}: unitPrice must be a positive number`);
    }
    return { productId: item.productId, quantity: item.quantity, unitPrice: item.unitPrice };
  });
}

module.exports = { validateUserId, validateOrderItems };
