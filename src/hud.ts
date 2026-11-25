// The trial HUD: score bug, lower-third dialogue (spoken aloud), and the charge sheet.
import { trial } from "./app";
import { sfx, voice } from "./audio";
import type { Charge } from "./charges";
import type { Fighter } from "./characters";
import { time, wait } from "./time";
import { $, el, esc, fam } from "./util";

let spoken: Promise<void> = Promise.resolve();
/** Lower third: a name tab over a paper bar set in the speaker's own font. Spoken aloud when voices are on. */
export function say(ch: Fighter | null, text: string): void {
  const d = $("dialog"); d.innerHTML = "";
  trial().cast.forEach(f => { f.talking = false; });
  const voiced = voice.on && !time.rush; // hurrying skips the voices too
  const who = el("span", "who", ch ? ch.name : "The court");
  if (ch) {
    who.style.setProperty("--acc", ch.color); ch.talking = true;
    if (!voiced) setTimeout(() => { ch.talking = false; }, Math.min(2200, 300 + text.length * 35));
  }
  const bar = el("div", "bar3"), line = el("span", "line" + (ch ? "" : " narr"), ch ? `“${text}”` : text);
  if (ch) line.style.fontFamily = fam(ch);
  bar.append(line); d.append(who, bar);
  spoken = voiced ? voice.speak(ch, text) : Promise.resolve();
}
/** Holds the scene until the line is finished: at least `ms` of reading time, longer if it is still being spoken. */
export const hold = (ms: number): Promise<unknown> => Promise.all([spoken, wait(ms)]);

/** Score bug: a small label, a title, and one tick per charge on trial. */
export function setPill(label: string, title: string): void {
  const t = trial();
  $("pillKicker").textContent = label; $("pillTitle").textContent = title;
  const dots = $("pillDots"); dots.innerHTML = "";
  for (let i = 0; i < t.size; i++) dots.append(el("i", i < t.idx ? "done" : i === t.idx ? "now" : ""));
}
export function setNext(label: string, enabled = true): void {
  const b = $<HTMLButtonElement>("next");
  b.innerHTML = `${esc(label)} <kbd>Space</kbd>`; b.disabled = !enabled;
}
/** Listeners turn to the speaker; the speaker faces the audience. */
export const lookAll = (target: Fighter): void => { trial().cast.forEach(f => { if (f.mood !== "ko") f.lookAt = f === target ? null : target; }); };

/** The charge sheet under the dialogue. The plain-English verdict stays hidden until the judge reads it. */
export function showSheet(c: Charge | null, revealed = false): void {
  const s = $("sheet");
  s.classList.toggle("hidden", !c);
  if (!c) return;
  const pips = Array.from({ length: 5 }, (_, i) => `<i class="${i < c.rule.severity ? "on" : ""}"></i>`).join("");
  s.innerHTML = `<div class="sh-l"><span class="lbl">${esc(c.label)}</span><span class="chg">Accused of ${esc(c.rule.charge)}</span><span class="pips sev${c.rule.severity}" title="How bad, out of 5">${pips}</span></div>`
    + `<blockquote><mark>${esc(c.quote)}</mark></blockquote>`
    + `<div class="plain${revealed ? " on" : ""}"><small>What you're agreeing to</small>${revealed ? `<span class="txt">${esc(c.rule.plain)}</span>` : `<span class="txt" aria-hidden="true">${esc(c.rule.plain)}</span><span class="sr">Verdict pending</span>`}</div>`;
}

/** Big slammed word over the scene: GUILTY, OUT!, DISMISSED. Red when the offence is serious. */
export async function stamp(word: string, ms = 1100, severe = false): Promise<void> {
  const k = $("ko"), span = k.querySelector("span")!;
  span.textContent = word; span.classList.toggle("severe", severe);
  k.classList.remove("hidden", "show"); void k.offsetWidth; k.classList.add("show");
  await wait(ms);
  k.classList.add("hidden");
}

export function setSoundIcon(): void {
  const off = sfx.muted, b = $("sound");
  b.innerHTML = `<svg class="i"><use href="#i-${off ? "mute" : "sound"}"/></svg>`;
  b.setAttribute("aria-label", off ? "Turn on sound and voices" : "Mute sound and voices");
  b.title = off ? "Sound and voices are off" : "Sound and voices are on";
}
