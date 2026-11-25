import { describe, expect, it } from "vitest";
import { prosecute, sentences, trimQuote } from "./charges";
import { SAMPLES } from "./samples";

describe("prosecute", () => {
  it("finds the classic offences in the Glimmer sample, worst first", () => {
    const c = prosecute(SAMPLES[0].text);
    const ids = c.charges.map(ch => ch.rule.id);
    for (const id of ["sell", "biometric", "location", "ai", "license", "share", "retain", "arbitration", "classaction", "changes", "terminate", "renew"]) expect(ids).toContain(id);
    expect(c.charges[0].rule.severity).toBe(5);
    const sell = c.charges.find(ch => ch.rule.id === "sell");
    expect(sell?.label).toBe("Clause 5.2");
    expect(sell?.quote.startsWith("We may sell")).toBe(true);
    expect(c.grade).toBe("E");
    expect(c.company).toBe("Glimmer");
  });

  it("acquits an honest policy", () => {
    const c = prosecute(SAMPLES[1].text);
    expect(c.charges.map(ch => ch.rule.id)).not.toContain("sell"); // "we never sell" is not a sale
    expect(c.grade).toBe("A");
  });

  it("labels paragraphs when there are no clause numbers", () => {
    expect(sentences("Hello there friend.\n\nWe may sell your personal data to anyone.")[1].label).toBe("Paragraph 2");
  });

  it("does not split sentences on e.g. or decimals", () => {
    expect(sentences("1.1 We collect data, e.g. your name, as described in 14.2 below.")).toHaveLength(1);
  });

  it("trims long quotes at a word boundary", () => {
    const q = trimQuote("word ".repeat(100), 50);
    expect(q.length).toBeLessThanOrEqual(51);
    expect(q.endsWith("…")).toBe(true);
  });
});

describe("forSpeech", () => {
  it("reads clause numbers as one number, not two", async () => {
    const { forSpeech } = await import("./tts");
    expect(forSpeech("Clause 3.2, you are accused")).toBe("Clause 3 point 2, you are accused");
    expect(forSpeech("Clause 14.2.1. Next sentence.")).toBe("Clause 14 point 2 point 1. Next sentence.");
  });
});
