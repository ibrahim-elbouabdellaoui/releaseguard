/**
 * Tests for UserService.
 *
 * NOTE: Only tests getUser() and isUserActive().
 * getUsersByTier() is NOT tested — deliberate gap for demo analysis.
 * The NEW getUser() response fields added in change-001 are NOT covered here.
 */

const { getUser, isUserActive } = require("../src/services/userService");

describe("UserService", () => {
  describe("getUser()", () => {
    test("returns a user profile for a known ID", () => {
      const user = getUser("u-001");
      expect(user).not.toBeNull();
      expect(user.id).toBe("u-001");
      expect(user.email).toBe("alice@example.com");
    });

    test("returns null for an unknown user ID", () => {
      const user = getUser("u-999");
      expect(user).toBeNull();
    });
  });

  describe("isUserActive()", () => {
    test("returns true for an active user", () => {
      expect(isUserActive("u-001")).toBe(true);
    });

    test("returns false for an inactive user", () => {
      expect(isUserActive("u-003")).toBe(false);
    });

    test("returns false for a non-existent user", () => {
      expect(isUserActive("u-999")).toBe(false);
    });
  });

  // getUsersByTier() — NOT TESTED
  // This is an intentional test gap. ReleaseGuard's Test Analyst will flag this.
});
