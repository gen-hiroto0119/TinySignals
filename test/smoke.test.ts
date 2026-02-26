import { describe, expect, it } from "vitest";
import { version } from "../src/index";

describe("tinyreactive scaffold", () => {
  it("exports version", () => {
    expect(version).toBe("0.1.0");
  });
});
