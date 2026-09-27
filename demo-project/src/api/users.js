/**
 * Users API handler — GET /users/:id
 * Thin handler: validates input, calls UserService, returns response.
 */

const express = require("express");
const { getUser } = require("../services/userService");
const { validateUserId } = require("../utils/validation");

const router = express.Router();

router.get("/:id", (req, res, next) => {
  try {
    const userId = validateUserId(req.params.id);
    const user = getUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
