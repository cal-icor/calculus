import { describe, expect, it } from "vitest";

import {
  angleValues,
  closestCommonAngle,
  normalizeAngle,
} from "../src/demos/unit_circle.js";

describe("normalizeAngle", () => {
  it("wraps positive and negative coterminal angles", () => {
    expect(normalizeAngle(450)).toBe(90);
    expect(normalizeAngle(-90)).toBe(270);
  });

  it("uses zero for invalid input", () => {
    expect(normalizeAngle(Number.NaN)).toBe(0);
  });
});

describe("angleValues", () => {
  it("returns exact axis values without floating-point noise", () => {
    expect(angleValues(90)).toMatchObject({
      cosine: 0,
      sine: 1,
      quadrant: "On an axis",
    });
  });

  it("identifies the third quadrant", () => {
    const result = angleValues(225);
    expect(result.quadrant).toBe("Quadrant III");
    expect(result.cosine).toBeCloseTo(-Math.SQRT1_2);
    expect(result.sine).toBeCloseTo(-Math.SQRT1_2);
  });
});

describe("closestCommonAngle", () => {
  it("snaps only within the requested tolerance", () => {
    expect(closestCommonAngle(44, 2)?.[0]).toBe(45);
    expect(closestCommonAngle(40, 2)).toBeNull();
  });
});
