// The static set: a black room printed with fine print, a grey gallery, light boxes and the notice board.
import * as THREE from "three";
import { canvasTex, fitPx, mat, mesh, scene } from "./scene";

{
  // A black floor printed edge to edge with fine print, with one highlighted line running through the middle
  const { x, t } = canvasTex(1024, 1024);
  x.fillStyle = "#151515"; x.fillRect(0, 0, 1024, 1024);
  const words = "you agree that we may collect use share retain and transfer your information to third parties at our sole discretion without notice including after termination ".split(" ");
  x.font = '13px "Fragment Mono", monospace'; x.textBaseline = "top";
  for (let y = 4, n = 0; y < 1024; y += 17) {
    let line = "";
    while (x.measureText(line).width < 1040) line += words[n++ % words.length] + " ";
    if (y === 497) { x.fillStyle = "rgba(230,255,46,.55)"; x.fillRect(0, y - 2, 1024, 17); x.fillStyle = "#151515"; }
    else x.fillStyle = "rgba(255,255,255,.13)";
    x.fillText(line, 4, y);
  }
  const floor = mesh(new THREE.CylinderGeometry(15, 15.6, 0.8, 96), [mat(0x0e0e0e), new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, metalness: 0 }), mat(0x0e0e0e)], false);
  floor.position.y = -0.4; scene.add(floor);
  const lip = mesh(new THREE.TorusGeometry(15.05, 0.07, 8, 96), new THREE.MeshBasicMaterial({ color: 0xf2f2f2 }), false);
  lip.rotation.x = Math.PI / 2; lip.position.y = 0.02; scene.add(lip);
}

// The public gallery: stepped concrete benches with a gap toward the camera
const STAND_GAP = 0.75;
{
  const profile: [number, number][] = [[18.5, -0.4], [18.5, 0.6], [20.3, 0.6], [20.3, 1.5], [22.1, 1.5], [22.1, 2.4], [23.9, 2.4], [23.9, 3.3], [26, 3.3], [26, -0.4]];
  scene.add(mesh(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 80, STAND_GAP, Math.PI * 2 - STAND_GAP * 2), mat(0x2a2a2a, { side: THREE.DoubleSide })));
}

/* ---------- The public: greys that fidget, and jump when the gavel falls ---------- */
const CROWD_COLORS = [0x3a3a3a, 0x5a5a5a, 0x7d7d7d, 0x262626, 0xbdbdbd, 0x4a4a4a, 0x9a9a9a, 0x303030, 0x6a6a6a, 0xe6e6e6];
interface Seat { r: number; y: number; a: number; ph: number }
const seats: Seat[] = [];
for (let tier = 0; tier < 4; tier++) {
  const r = 19.4 + tier * 1.8, y = 0.6 + tier * 0.9;
  for (let a = STAND_GAP + 0.06; a < Math.PI * 2 - STAND_GAP - 0.06; a += 1.36 / r) seats.push({ r: r + (Math.random() - 0.5) * 0.3, y, a, ph: Math.random() * 10 });
}
const crowdMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.75, 0.3), new THREE.MeshStandardMaterial({ roughness: 0.8 }), seats.length);
crowdMesh.castShadow = true;
seats.forEach((_, i) => crowdMesh.setColorAt(i, new THREE.Color(CROWD_COLORS[i % CROWD_COLORS.length])));
scene.add(crowdMesh);

export const crowd = {
  /** Excitement, about 0.1 (murmur) to 2+ (thrown out of court). Decays on its own. */
  cheer: 0,
};
const dummy = new THREE.Object3D();
export function updateCrowd(now: number, dt: number): void {
  crowd.cheer = Math.max(0.12, crowd.cheer - dt * 0.5);
  seats.forEach((s, i) => {
    dummy.position.set(Math.sin(s.a) * s.r, s.y + 0.38 + Math.max(0, Math.sin(now * 0.008 + s.ph)) * crowd.cheer * 0.8, Math.cos(s.a) * s.r);
    dummy.rotation.set(0, s.a + Math.PI, Math.sin(now * 0.006 + s.ph) * crowd.cheer * 0.3);
    dummy.updateMatrix(); crowdMesh.setMatrixAt(i, dummy.matrix);
  });
  crowdMesh.instanceMatrix.needsUpdate = true;
}

// Plain light boxes on black poles
for (const a of [1.3, -1.3, 2.6, -2.6]) {
  const g = new THREE.Group(), pole = mesh(new THREE.BoxGeometry(0.35, 12, 0.35), mat(0x1a1a1a));
  pole.position.y = 6;
  const head = mesh(new THREE.BoxGeometry(2.6, 1.1, 0.5), new THREE.MeshBasicMaterial({ color: 0xffffff }), false);
  head.position.y = 12.2; g.add(pole, head); g.position.set(Math.sin(a) * 27.5, 0, Math.cos(a) * 27.5); g.lookAt(0, 0, 0); scene.add(g);
}

/* ---------- The notice board: a plain white sheet ---------- */
const board = canvasTex(1024, 320);
{
  const frame = mesh(new THREE.BoxGeometry(17, 5.9, 0.6), mat(0x111111)); frame.position.set(0, 10.5, -27.5);
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(16.2, 5.06), new THREE.MeshBasicMaterial({ map: board.t, toneMapped: false }));
  sheet.position.set(0, 10.5, -27.18);
  const leg = mesh(new THREE.BoxGeometry(0.5, 8, 0.5), mat(0x111111)); leg.position.set(0, 4, -27.6);
  scene.add(frame, sheet, leg);
}
/** Rewrites the notice board: a small mono label, a big title, and a mono footnote. */
export function setJumbo(top: string, title: string, sub: string): void {
  const x: CanvasRenderingContext2D & { letterSpacing?: string } = board.x;
  x.fillStyle = "#ffffff"; x.fillRect(0, 0, 1024, 320);
  x.fillStyle = "#0a0a0a"; x.fillRect(0, 0, 1024, 10);
  x.textAlign = "left"; x.textBaseline = "alphabetic";
  x.fillStyle = "#5c5c5c"; x.font = `400 30px "Fragment Mono", monospace`; x.fillText(top.toLowerCase(), 52, 78);
  const family = `"Schibsted Grotesk", Arial, sans-serif`;
  if ("letterSpacing" in x) x.letterSpacing = "-4px";
  x.fillStyle = "#0a0a0a"; x.font = `900 ${fitPx(x, title, 900, family, 920, 128)}px ${family}`; x.fillText(title, 46, 208);
  if ("letterSpacing" in x) x.letterSpacing = "0px";
  x.font = `400 30px "Fragment Mono", monospace`;
  const sw = x.measureText(sub).width;
  x.fillStyle = "#e6ff2e"; x.fillRect(46, 246, sw + 16, 40); x.fillStyle = "#0a0a0a"; x.fillText(sub, 54, 276);
  board.t.needsUpdate = true;
}
