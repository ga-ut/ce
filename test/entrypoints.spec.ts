import { describe, expect, it } from "vitest";

describe("entrypoint boundaries", () => {
  it("does not expose web runtime APIs from the root entrypoint", async () => {
    const rootEntry = await import("../src");

    expect("CE" in rootEntry).toBe(false);
    expect("html" in rootEntry).toBe(false);
  });

  it("exposes web runtime APIs from the web entrypoint", async () => {
    const webEntry = await import("../src/web");

    expect(typeof webEntry.CE.define).toBe("function");
    expect(typeof webEntry.html).toBe("function");
  });
});
