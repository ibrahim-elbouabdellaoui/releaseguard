/**
 * Orders API handler — POST /orders, GET /orders/:id
 */

const express = require("express");
const { createOrder, getOrder } = require("../services/orderService");
const { validateUserId, validateOrderItems } = require("../utils/validation");

const router = express.Router();

// POST /orders — create a new order
router.post("/", (req, res, next) => {
  try {
    const { userId, items } = req.body;
    const validUserId = validateUserId(userId);
    const validItems = validateOrderItems(items);
    const order = createOrder(validUserId, validItems);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// GET /orders/:id — retrieve an order
router.get("/:id", (req, res, next) => {
  try {
    const order = getOrder(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
