import { describe, expect, it } from "vitest";
import { needsSwitch } from "@/lib/contracts/chain-guard";

describe("needsSwitch (AE5)", () => {
  it("is false on the supported chain", () => {
    expect(needsSwitch(421614, 421614)).toBe(false);
  });

  it("is true on any other chain", () => {
    expect(needsSwitch(1, 421614)).toBe(true);
    expect(needsSwitch(11155111, 421614)).toBe(true);
    expect(needsSwitch(42161, 421614)).toBe(true);
  });

  it("is false while no wallet is connected; the connect flow owns that case", () => {
    expect(needsSwitch(undefined, 421614)).toBe(false);
  });
});
