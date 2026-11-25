// The paste screen: the terms go in, the charges come out.
import { showScreen } from "./app";
import { prosecute } from "./charges";
import { SAMPLES } from "./samples";
import { startTrial } from "./trial";
import { $, el } from "./util";

export function initIntake(): void {
  const text = $<HTMLTextAreaElement>("tos"), company = $<HTMLInputElement>("company"), err = $("intakeErr");
  const box = $("samples");
  for (const s of SAMPLES) {
    const b = el("button", "chip", s.name); b.type = "button";
    b.onclick = () => { text.value = s.text; company.value = ""; err.textContent = ""; text.focus(); };
    box.append(b);
  }
  // Cmd/Ctrl+Enter from the text box starts the trial
  text.addEventListener("keydown", e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); $<HTMLFormElement>("intakeForm").requestSubmit(); } });
  $<HTMLFormElement>("intakeForm").onsubmit = e => {
    e.preventDefault();
    const tos = text.value.trim();
    if (tos.length < 200) { err.textContent = "Paste the full terms or privacy policy. A few paragraphs at least."; text.focus(); return; }
    err.textContent = "";
    void startTrial(prosecute(tos, company.value));
  };
}
export const openIntake = (): void => { showScreen("intake"); $("tos").focus({ preventScroll: true }); };
