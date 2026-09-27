/**
 * UserService — manages user account lookups and profile data.
 * Used by OrderService, PaymentService, and the /users API handler.
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} id
 * @property {string} email
 * @property {string} name
 * @property {"standard" | "premium" | "enterprise"} tier
 * @property {boolean} active
 */

const userStore = new Map([
  ["u-001", { id: "u-001", email: "alice@example.com", name: "Alice Johnson", tier: "premium", active: true }],
  ["u-002", { id: "u-002", email: "bob@example.com", name: "Bob Smith", tier: "standard", active: true }],
  ["u-003", { id: "u-003", email: "carol@example.com", name: "Carol White", tier: "enterprise", active: false }],
]);

/**
 * Retrieves a user profile by ID.
 * Returns null if the user does not exist.
 *
 * @param {string} userId
 * @returns {{ id: string, email: string, name: string, tier: string, active: boolean } | null}
 */
function getUser(userId) {
  const user = userStore.get(userId);
  return user ?? null;
}

/**
 * Returns whether a user account is currently active.
 *
 * @param {string} userId
 * @returns {boolean}
 */
function isUserActive(userId) {
  const user = getUser(userId);
  return user !== null && user.active === true;
}

/**
 * Returns all users in a given tier.
 *
 * @param {"standard" | "premium" | "enterprise"} tier
 * @returns {Array}
 */
function getUsersByTier(tier) {
  return [...userStore.values()].filter((u) => u.tier === tier);
}

module.exports = { getUser, isUserActive, getUsersByTier };
