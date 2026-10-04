import { describe, expect, it } from "vitest";
import { formatCountdown } from "@/lib/demo/countdown";

describe("formatCountdown", () => {
  it("formats minutes and seconds", () => {
    expect(formatCountdown(0)).toBe("0:00");
    expect(formatCountdown(65)).toBe("1:05");
    expect(formatCountdown(3599)).toBe("59:59");
  });
  it("adds hours from one hour up", () => {
    expect(formatCountdown(3600)).toBe("1:00:00");
    expect(formatCountdown(4200)).toBe("1:10:00");
  });
  it("never goes negative", () => {
    expect(formatCountdown(-5)).toBe("0:00");
  });
});
