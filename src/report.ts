// The report card: the grade, and every guilty clause in plain English, including the ones that didn't make the trial.
import { showScreen, trial } from "./app";
import type { Grade } from "./charges";
import { $, esc } from "./util";

const SUMMARY: Record<Grade, string> = {
  A: "Clean. Rare. Frame it.",
  B: "Mostly fine, with a few standard catches.",
  C: "Read these parts before you agree.",
  D: "Think twice before you sign up.",
  E: "Run.",
};

export function showReport(): void {
  const t = trial(), c = t.case;
  $("vFor").textContent = c.company;
  const g = $("vGrade"); g.textContent = c.grade; g.dataset.grade = c.grade;
  const n = c.charges.length, tried = t.idx; // charges actually heard (fewer if the viewer skipped)
  const found = n ? `${n} problem${n === 1 ? "" : "s"} found${tried === 0 ? ", none tried in court" : n > tried ? `, the worst ${tried} tried in court` : ""}.` : "Nothing matched our list of known bad patterns.";
  $("vSummary").innerHTML = `${esc(SUMMARY[c.grade])}<small>${found} Grades run from A (clean) to E (worst).</small>`;
  $("vListHead").textContent = n ? "Found guilty" : "Case dismissed";
  $("vList").innerHTML = c.charges.length
    ? c.charges.map((ch, i) => `<li class="sev${ch.rule.severity}"><div class="r1"><b>${esc(ch.label)}</b><span class="pips">${Array.from({ length: 5 }, (_, k) => `<i class="${k < ch.rule.severity ? "on" : ""}"></i>`).join("")}</span>${i < tried ? "" : `<em>Not tried</em>`}</div>`
      + `<p class="chg">Guilty of ${esc(ch.rule.charge)}</p><p>${esc(ch.rule.plain)}</p><details><summary>Read the clause</summary><q><span>${esc(ch.quote)}</span></q></details></li>`).join("")
    : `<li><p>A good sign. Our rules can still miss unusual wording, so skim the parts about data, payments and disputes.</p></li>`;
  showScreen("report");
  $("vHead").focus({ preventScroll: true });
}

/** Plain-text verdict for sharing. */
function verdictText(): string {
  const c = trial().case;
  return [`Fine Print Court: ${c.company}'s terms get grade ${c.grade}. ${SUMMARY[c.grade]}`, "", ...c.charges.map(ch => `- ${ch.label}, guilty of ${ch.rule.charge}: ${ch.rule.plain}`)].join("\n");
}

export function initReport(onNewCase: () => void): void {
  $("copy").onclick = async () => {
    const b = $("copy");
    try { await navigator.clipboard.writeText(verdictText()); b.textContent = "Copied"; }
    catch { b.textContent = "Copy failed"; }
    setTimeout(() => { b.textContent = "Copy verdict"; }, 1600);
  };
  $("again").onclick = onNewCase;
}
