import { describe, expect, it } from "vitest";
import { plainText } from "./text";

describe("plainText", () => {
  it("strips tags and Spanish entities", () => {
    expect(plainText("<p>Bienvenido &#039;Marshall&#039; &amp; Berlanga</p>")).toBe(
      "Bienvenido 'Marshall' & Berlanga",
    );
  });

  it("returns an empty string for non-strings", () => {
    expect(plainText(null)).toBe("");
    expect(plainText(12)).toBe("");
  });
});
