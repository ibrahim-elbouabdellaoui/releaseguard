/**
 * Tests for validation utilities.
 * validateUserId and validateOrderItems are covered.
 */

const { validateUserId, validateOrderItems } = require("../src/utils/validation");

describe("validateUserId()", () => {
  test("accepts a valid user ID", () => {
    expect(validateUserId("u-001")).toBe("u-001");
  });

  test("rejects a non-string value", () => {
    expect(() => validateUserId(123)).toThrow("Invalid userId format");
  });

  test("rejects an ID that is too short", () => {
    expect(() => validateUserId("ab")).toThrow("Invalid userId format");
  });

  test("rejects an ID with illegal characters", () => {
    expect(() => validateUserId("user@domain")).toThrow("Invalid userId format");
  });
});

describe("validateOrderItems()", () => {
  test("accepts a valid item array", () => {
    const items = [{ productId: "p-100", quantity: 2, unitPrice: 9.99 }];
    expect(validateOrderItems(items)).toHaveLength(1);
  });

  test("rejects an empty array", () => {
    expect(() => validateOrderItems([])).toThrow("at least one item");
  });

  test("rejects an item with zero quantity", () => {
    expect(() =>
      validateOrderItems([{ productId: "p-100", quantity: 0, unitPrice: 9.99 }])
    ).toThrow("quantity");
  });
});

// NOTE: OrderService and PaymentService are NOT tested here.
// createOrder(), processPayment() — deliberate gaps for ReleaseGuard demo.
