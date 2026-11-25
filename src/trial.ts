// The trial: the court opens, each accused clause takes the stand, is charged, defends itself, and gets its verdict.
import * as THREE from "three";
import { app, showScreen, trial, type Trial } from "./app";
import { crowd, setJumbo } from "./arena";
import { sfx, voice } from "./audio";
import { cam, camArrived, camIdle, shotImpact, shotOn, shotOverShoulder, shotWide, showLabels } from "./camera";
import { TRIAL_SIZE, type Case, type Charge } from "./charges";
import { HOME, LYING, PODIUM_TOP, buildCharacter, setMood, stage, type Fighter, type FighterSeed } from "./characters";
import { addStars, confetti, debris, flashScreen, letterbox, shockwave } from "./effects";
import { hold, lookAll, say, setNext, setPill, setSoundIcon, showSheet, stamp } from "./hud";
import { openIntake } from "./intake";
import { showReport } from "./report";
import { canvas, mat, mesh, smooth } from "./scene";
import { gtween, hitStop, slowMo, time, wait } from "./time";
import { $, RM, ease, easeOut, store } from "./util";

const HI = "#e6ff2e";
const JUDGE: Omit<FighterSeed, "home"> = { name: "The Judge", font: "Schibsted Grotesk", cat: "Serif", belly: "⚖", color: "#7b4dff", slot: 1, hat: "wig" };
const PROSECUTOR: Omit<FighterSeed, "home"> = { name: "The Prosecutor", font: "Schibsted Grotesk", cat: "Sans", belly: "!", color: "#2f6bff", slot: 0 };
const autoPlay = () => $<HTMLInputElement>("auto").checked;
const hop = (ch: Fighter, height: number, ms = 420) => gtween(ms, t => { ch.root.position.y = Math.sin(t * Math.PI) * height; });

function buildPodium(color: string, home: THREE.Vector3): THREE.Group {
  const podium = new THREE.Group();
  const base = mesh(new THREE.CylinderGeometry(1.9, 2.2, 0.7, 48), smooth(0x232323, { roughness: 0.7 })); base.position.y = 0.35;
  const cap = mesh(new THREE.CylinderGeometry(1.78, 1.78, 0.04, 48), smooth(0x2e2e2e, { roughness: 0.5 }), false); cap.position.y = 0.71;
  const ring = mesh(new THREE.TorusGeometry(1.92, 0.085, 10, 64), smooth(color, { emissive: color, emissiveIntensity: 1 }), false);
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.72;
  podium.add(base, cap, ring); podium.position.copy(home);
  return podium;
}
/** A character on its own lit podium. */
function place(seed: Omit<FighterSeed, "home">, home: THREE.Vector3): Fighter {
  const ch = buildCharacter({ ...seed, home: home.clone() });
  ch.podium = buildPodium(ch.color, ch.home); stage.add(ch.podium);
  ch.spot = new THREE.SpotLight(0xffffff, 0.6, 40, 0.3, 0.8, 1.2);
  ch.spot.position.set(ch.home.x * 0.7, 15, ch.home.z + 7); ch.spot.target = ch.podium; stage.add(ch.spot);
  ch.root.position.copy(ch.home).setY(0); stage.add(ch.root);
  ch.yaw = ch.homeYaw = Math.atan2(-ch.home.x, 18 - ch.home.z);
  return ch;
}
/** The judge's bench: a wooden desk that hides the judge's legs. */
function buildBench(): void {
  const wood = mat(0x161616), z = HOME[1].z + 2.1;
  const desk = mesh(new THREE.BoxGeometry(5.2, 1.45, 0.9), wood); desk.position.set(0, 0.72, z);
  const top = mesh(new THREE.BoxGeometry(5.6, 0.14, 1.3), mat(0xefefef)); top.position.set(0, 1.5, z);
  stage.add(desk, top);
}

/** The Judge and Prosecutor idle at their posts behind the paste screen, so the room isn't empty. */
export const idleCast: Fighter[] = [];
export function setIdleStage(): void {
  stage.clear(); buildBench();
  idleCast.length = 0;
  idleCast.push(place(JUDGE, HOME[1]), place(PROSECUTOR, HOME[0]));
}

export async function startTrial(c: Case): Promise<void> {
  sfx.unlock(); voice.stop();
  stage.clear(); idleCast.length = 0; buildBench();
  const judge = place(JUDGE, HOME[1]), prosecutor = place(PROSECUTOR, HOME[0]);
  const t: Trial = { case: c, size: Math.min(TRIAL_SIZE, c.charges.length), judge, prosecutor, accused: null, cast: [judge, prosecutor], idx: 0 };
  app.trial = t; app.busy = true; time.rush = false;
  showScreen("trial"); showSheet(null); setSoundIcon(); setNext("…", false);
  setJumbo(c.company, "Fine Print Court", t.size ? `${t.size} clauses on trial` : "no charges filed");
  setPill("", `Court is in session`);
  shotWide(); sfx.gavel(); crowd.cheer = 1;
  say(null, "All rise. Fine Print Court is now in session.");
  await hold(1800);
  shotOn(judge); lookAll(judge); await camArrived();
  if (!t.size) {
    setMood(judge, "happy"); confetti(judge); sfx.fanfare();
    say(judge, `I read every line of ${c.company}'s terms. Nothing here deserves a trial. Case dismissed!`);
    await stamp("DISMISSED", 1400); await hold(1500);
    return finish();
  }
  const extra = c.charges.length - t.size;
  say(judge, `${c.company}'s terms of service stand accused. The clerk found ${c.charges.length} problem${c.charges.length > 1 ? "s" : ""} in them. ${extra > 0 ? `The worst ${t.size} face this court today.` : "Bring them in."}`);
  await hold(2600);
  shotWide(); t.cast.forEach(f => { f.lookAt = null; });
  setPill("", `${t.size} on trial`);
  app.busy = false; setNext("Bring in the accused"); $("next").focus({ preventScroll: true });
  if (autoPlay()) autoAdvance();
}

/** The previous accused leaves; the new one rises into the dock. */
async function bringIn(c: Charge): Promise<Fighter> {
  const t = trial(), old = t.accused;
  if (old) {
    const y0 = old.root.position.y;
    await gtween(500, k => { old.podium!.position.y = -k * 4; old.root.position.y = y0 - k * 4; });
    stage.remove(old.root, old.podium!, old.spot!); t.cast = t.cast.filter(f => f !== old);
  }
  const ch = place({ name: c.label, font: "Fragment Mono", cat: "Display", belly: "§", color: HI, slot: 2 + t.idx, hat: "none" }, HOME[2]);
  t.accused = ch; t.cast.push(ch);
  ch.podium!.position.y = -4; ch.root.position.y = -4; sfx.whoosh();
  await gtween(700, k => { const y = -4 * (1 - easeOut(k)); ch.podium!.position.y = y; ch.root.position.y = y; });
  setMood(ch, "smug");
  return ch;
}

async function nextCharge(): Promise<void> {
  if (app.busy) { time.rush = true; voice.stop(); return; } // pressing Next mid-scene hurries it
  const t = trial();
  if (t.idx >= t.size) return finish();
  const c = t.case.charges[t.idx], n = t.size;
  app.busy = true; time.rush = false; setNext("Faster");
  setPill(`${t.idx + 1} of ${n}`, `Case ${t.idx + 1}`);
  setJumbo(`Case ${t.idx + 1} / ${n}`, c.label, `accused of ${c.rule.charge}`);
  showSheet(c);
  shotWide(); crowd.cheer = 0.8;
  const acc = await bringIn(c);
  say(null, `The court calls ${c.label}.`); await hold(1200);

  const { prosecutor: pros, judge } = t;
  shotOn(pros); lookAll(pros); await camArrived(); setMood(pros, "angry");
  say(pros, `${c.label}, you are accused of ${c.rule.charge}.`); await hold(2000);
  setMood(pros, "smug");
  say(pros, `Exhibit A, in its own words: ${c.quote}`); await hold(2800);
  setMood(pros, "idle");

  shotOn(acc); lookAll(acc); await camArrived(); void hop(acc, 0.8);
  say(acc, c.rule.defence); crowd.cheer = 0.5; await hold(2200);

  shotOn(judge); lookAll(judge); await camArrived(); setMood(judge, "angry");
  sfx.gavel(); await wait(220); sfx.gavel(); void flashScreen(0.4); crowd.cheer = 1.4; setMood(acc, "hurt");
  await stamp("GUILTY", 900, c.rule.severity >= 4);
  showSheet(c, true);
  say(judge, `Guilty. In plain English: ${c.rule.plain}`); await hold(2600);
  setMood(judge, "idle");

  // The sentence fits the crime
  const sev = c.rule.severity;
  if (sev >= 4) { letterbox(true); await attack(pros, acc); letterbox(false); say(null, `${c.label} is thrown out of court!`); }
  else if (sev === 3) { shotWide(); void hop(acc, 0.5); say(null, "Guilty as charged. Watch out for this one."); }
  else { shotWide(); setMood(acc, "smug"); say(null, "Guilty, but this one is standard. Most apps have a clause like it."); }
  await hold(1600);

  t.idx++;
  t.cast.forEach(f => { f.lookAt = null; if (f.mood !== "ko") setMood(f, f === acc ? "smug" : "idle"); });
  const last = t.idx >= n;
  setPill(`${t.idx} of ${n} closed`, last ? "Verdict next" : `Next: ${t.case.charges[t.idx].label}`);
  app.busy = false; time.rush = false;
  setNext(last ? "Hear the final verdict" : "Next accused");
  if (autoPlay()) autoAdvance();
}

let autoTimer: ReturnType<typeof setTimeout> | undefined;
function autoAdvance(): void {
  clearTimeout(autoTimer);
  autoTimer = setTimeout(() => { if (autoPlay() && !app.busy && app.screen === "trial") void nextCharge(); }, 1600);
}

/** The prosecutor charges across the room and knocks the clause off its podium. */
async function attack(att: Fighter, def: Fighter): Promise<void> {
  const a0 = att.root.position.clone(), d0 = def.root.position.clone(), dir = d0.clone().sub(a0).setY(0).normalize();
  att.lookAt = def; def.lookAt = att; setMood(att, "angry");
  shotOverShoulder(att, def); await wait(500);
  const windUp = a0.clone().addScaledVector(dir, -0.6), stop = d0.clone().addScaledVector(dir, -1.7), torso = att.torso;
  att.lockYaw = true; att.root.rotation.y = Math.atan2(dir.x, dir.z);
  await gtween(200, k => { att.root.position.lerpVectors(a0, windUp, easeOut(k)); torso.scale.x = 1 + k * 0.12; torso.userData.sy = 1 - k * 0.15; att.punch = -k; });
  sfx.whoosh();
  await gtween(260, k => { att.root.position.lerpVectors(windUp, stop, k * k); att.root.position.y = Math.sin(k * Math.PI) * 0.6; torso.scale.x = 0.9; torso.userData.sy = 1.15; att.punch = Math.max(0.01, k); });
  torso.scale.x = 1; torso.userData.sy = 1;
  shotImpact(def, att); void flashScreen(1); sfx.impact(1);
  shockwave(d0, att.color); debris(d0, att, 24);
  setMood(def, "hurt"); crowd.cheer = 1.3; cam.shake = 1;
  await hitStop(160);
  await knockout(def, dir);
  shotWide({ dur: 550 });
  await gtween(380, k => { att.root.position.lerpVectors(stop, a0, ease(k)); att.root.position.y = Math.sin(k * Math.PI) * 0.4; att.punch = 1 - k; });
  att.punch = 0; att.lockYaw = false; setMood(att, "smug");
  await wait(300);
}

async function knockout(def: Fighter, dir: THREE.Vector3): Promise<void> {
  sfx.ko(); crowd.cheer = 2;
  if (!RM) { slowMo(0.25, 2000); canvas.style.filter = "saturate(.15) contrast(1.2)"; }
  showLabels(false);
  // Sway in front of where it lands (a full orbit swings behind the bench and the crowd)
  const land = def.root.position.clone().addScaledVector(dir, 2.2).setY(0);
  cam.orbit = { at: land, r: 8.5, h: 3.8, lookY: 1, speed: RM ? 0 : 1.4, a: 0, sway: 0.5 };
  void stamp("OUT!", 1500, true);
  setMood(def, "ko"); def.lockYaw = true; def.talking = false;
  const p0 = def.root.position.clone(), y0 = def.root.rotation.y;
  await gtween(420, k => {
    def.root.position.copy(p0).addScaledVector(dir, 2.2 * easeOut(k)); def.root.position.y = Math.sin(k * Math.PI) * 1.6;
    def.root.rotation.y = y0 + k * Math.PI * 1.5; def.rig.rotation.x = (-k * Math.PI) / 2;
    def.lift.position.y = PODIUM_TOP + (LYING - PODIUM_TOP) * k * k;
  });
  def.blob.visible = false; addStars(def); sfx.cheer(2);
  await wait(1500);
  time.scale = 1; canvas.style.filter = ""; cam.orbit = null;
}

/** Closes the court and opens the report card. */
async function finish(): Promise<void> {
  const t = trial();
  app.busy = true; clearTimeout(autoTimer); setNext("…", false); showSheet(null);
  const { judge } = t, c = t.case;
  t.cast.forEach(f => { f.lookAt = null; });
  setJumbo(`${c.company} terms`, `Grade ${c.grade}`, `${c.charges.length} problem${c.charges.length === 1 ? "" : "s"} found`);
  setPill("", `Grade ${c.grade}`);
  shotOn(judge); await camArrived();
  setMood(judge, c.grade <= "B" ? "happy" : "angry");
  if (c.grade <= "B") { confetti(judge); sfx.fanfare(); }
  say(judge, c.grade <= "B" ? `Grade ${c.grade}. Better than most. Court is adjourned.` : `Grade ${c.grade}. Read the report before you tap "I agree". Court is adjourned.`);
  sfx.gavel(); crowd.cheer = 1.2;
  await hold(1600);
  // On phones the report covers the bottom two thirds, so come in close and low on the bench instead of the sky
  cam.orbit = innerWidth <= 760
    ? { at: new THREE.Vector3(0, 0, -1), r: 12, h: 4.4, lookY: 1.6, speed: RM ? 0 : 0.3, a: 0, sway: 0.35 }
    : { at: new THREE.Vector3(0, 0, 0), r: 16, h: 7, lookY: 2.4, speed: RM ? 0 : 0.35, a: 0, sway: 0.5 };
  showReport();
  app.busy = false;
}

/** Back to the paste screen. */
export function closeCourt(): void {
  voice.stop(); clearTimeout(autoTimer); app.trial = null; app.busy = false; time.rush = false;
  setIdleStage(); camIdle(); setJumbo("Fine Print Court", "Order in the court", "paste the terms to begin");
}

export function initTrial(): void {
  // A scene that is mid-flight finishes (hurried) before we skip or leave, so two scripts never share the stage
  let skipWhenFree = false, exitWhenFree = false;
  const exit = () => { closeCourt(); openIntake(); };
  $("next").onclick = () => { void nextCharge(); };
  $("skip").onclick = () => { voice.stop(); if (app.busy) { time.rush = true; skipWhenFree = true; } else void finish(); };
  $("exit").onclick = () => { voice.stop(); if (app.busy) { time.rush = true; exitWhenFree = true; } else exit(); };
  setInterval(() => {
    if (app.busy || app.screen !== "trial") return;
    if (exitWhenFree) { exitWhenFree = skipWhenFree = false; exit(); }
    else if (skipWhenFree) { skipWhenFree = false; void finish(); }
  }, 200);
  // Auto-play is on unless the viewer turned it off: a show should run without hunting for a button
  const auto = $<HTMLInputElement>("auto");
  auto.checked = store.get("auto", true);
  auto.onchange = () => { store.set("auto", auto.checked); if (autoPlay() && !app.busy) autoAdvance(); };
  $("sound").onclick = () => { sfx.toggle(); voice.stop(); setSoundIcon(); };
  addEventListener("keydown", e => {
    const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName ?? "");
    if ((e.code === "Space" || e.key === "Enter") && app.screen === "trial" && !typing) { e.preventDefault(); void nextCharge(); }
  });
}
