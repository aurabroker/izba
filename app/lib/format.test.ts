import { describe, expect, it } from "vitest";
import {
  addMonths,
  formatDate,
  formatPLN,
  generateCertificateNumber,
  isoDate,
} from "./format";

describe("formatPLN", () => {
  it("formatuje kwotę jako PLN", () => {
    const s = formatPLN(1234.5);
    expect(s).toMatch(/zł/);
    expect(s).toContain("234,50");
  });
  it("formatuje zero", () => {
    expect(formatPLN(0)).toMatch(/0,00/);
  });
});

describe("formatDate", () => {
  it("zwraca myślnik dla null", () => {
    expect(formatDate(null)).toBe("—");
  });
  it("formatuje datę w układzie dd.mm.rrrr", () => {
    expect(formatDate("2026-06-28T12:00:00Z")).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
  });
});

describe("addMonths", () => {
  it("dodaje miesiące przekraczając rok", () => {
    const d = addMonths(new Date("2026-01-15T00:00:00Z"), 12);
    expect(d.getFullYear()).toBe(2027);
  });
  it("dodaje 6 miesięcy", () => {
    const base = new Date("2026-01-10T00:00:00Z");
    const d = addMonths(base, 6);
    expect(d.getMonth()).toBe((base.getMonth() + 6) % 12);
  });
});

describe("isoDate", () => {
  it("zwraca format YYYY-MM-DD", () => {
    expect(isoDate(new Date("2026-06-28T10:30:00Z"))).toBe("2026-06-28");
  });
});

describe("generateCertificateNumber", () => {
  it("ma format PISKP/RRRR/XXXX", () => {
    const n = generateCertificateNumber(new Date("2026-03-01T00:00:00Z"));
    expect(n).toMatch(/^PISKP\/2026\/[A-Z0-9]+$/);
  });
  it("generuje różne numery", () => {
    const a = generateCertificateNumber();
    const b = generateCertificateNumber();
    expect(a).not.toBe(b);
  });
});
