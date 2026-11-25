// Fine Print Court: paste a Terms of Service, and its worst clauses stand trial in a 3D courtroom.
import "./styles.css";
import * as THREE from "three";
import { app } from "./app";
import { setJumbo, updateCrowd } from "./arena";
import { camIdle, updateCamera } from "./camera";
import { animateCharacter } from "./characters";
import { updateSprites } from "./effects";
import { initIntake, openIntake } from "./intake";
import { initReport } from "./report";
import { camera, frameView, renderer, scene } from "./scene";
import { stepTweens, time } from "./time";
import { loadNeural, onNeuralProgress } from "./tts";
import { sfx } from "./audio";
import { closeCourt, idleCast, initTrial, setIdleStage } from "./trial";
import { $, sleep } from "./util";

const clock = new THREE.Clock();
function frame(): void {
  // dt is real time (capped so a background tab doesn't jump); gdt is game time, which hit-stop, slow motion and "Faster" bend
  const dt = Math.min(0.05, clock.getDelta()), now = performance.now(), gdt = dt * time.scale * (time.rush ? 2.2 : 1);
  stepTweens(gdt * 1000);
  updateCrowd(now, dt); updateSprites(gdt);
  for (const ch of app.trial?.cast ?? idleCast) animateCharacter(ch, gdt, now);
  frameView(dt); updateCamera(dt, now);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

initIntake(); initTrial(); initReport(() => { closeCourt(); openIntake(); });

// The cast and the big screen draw with web fonts, so wait for them (briefly) before the first frame
const faces = ['900 40px "Schibsted Grotesk"', '700 40px "Schibsted Grotesk"', '400 40px "Fragment Mono"', '800 40px "Schibsted Grotesk"'].map(f => document.fonts.load(f));
void Promise.race([Promise.all(faces), sleep(3000)])
  .catch(() => { /* fall back to system fonts */ })
  .then(() => {
    setJumbo("Fine Print Court", "Order in the court", "paste the terms to begin");
    setIdleStage(); camIdle(); camera.position.set(0, 9, 22);
    $("loading").classList.add("hidden");
    openIntake();
    frame();
    // Natural voices download in the background while the visitor reads the paste screen
    const status = $("voiceStatus");
    onNeuralProgress(p => {
      status.textContent = p === "off" ? "" : p === "ready" ? "Natural voices ready." : `Loading natural voices… ${p}%`;
    });
    // Skipped while sound is off (no point downloading ~330 MB of voices nobody hears); unmuting starts it
    setTimeout(() => { if (!sfx.muted) void loadNeural(); }, 1200);
  });
