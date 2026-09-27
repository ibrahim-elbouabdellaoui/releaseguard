/**
 * PaymentService — processes payment for orders.
 * Depends on UserService (fetches user tier for discount logic) and
 * an external payment gateway via axios.
 */

const axios = require("axios");
const { getUser } = require("./userService");

const PAYMENT_GATEWAY_URL = process.env.PAYMENT_GATEWAY_URL || "https://payments.internal/v1";

/**
 * Calculates the applicable discount rate for a user based on their tier.
 *
 * @param {"standard" | "premium" | "enterprise"} tier
 * @returns {number} discount rate (0.0 to 1.0)
 */
function getTierDiscount(tier) {
  const discounts = { standard: 0.0, premium: 0.05, enterprise: 0.12 };
  return discounts[tier] ?? 0.0;
}

/**
 * Submits a payment request to the external payment gateway.
 *
 * @param {string} orderId
 * @param {string} userId
 * @param {number} amount
 * @returns {Promise<{ transactionId: string, status: string }>}
 */
async function processPayment(orderId, userId, amount) {
  const user = getUser(userId);
  if (!user) {
    throw new Error(`Cannot process payment: user ${userId} not found`);
  }

  const discount = getTierDiscount(user.tier);
  const finalAmount = parseFloat((amount * (1 - discount)).toFixed(2));

  try {
    const response = await axios.post(`${PAYMENT_GATEWAY_URL}/charge`, {
      orderId,
      userId,
      amount: finalAmount,
      currency: "USD",
    });
    return response.data;
  } catch (err) {
    // Error handler present — logs and re-throws for caller to handle
    console.error(`Payment failed for order ${orderId}:`, err.message);
    throw err;
  }
}

module.exports = { processPayment, getTierDiscount };
