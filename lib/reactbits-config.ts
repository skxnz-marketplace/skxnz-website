// Tunables for the React Bits effects on the /ai screen, restored from the July
// local-polish-auth-ui working tree (backup/local-polish-auth-ui-wip).

export const dotFieldConfig = {
  dotRadius: 1,
  dotSpacing: 24,
  cursorForce: 0,
  cursorRadius: 0,
  bulgeStrength: 0,
  glowRadius: 40,
  waveAmplitude: 0,
  sparkle: false,
  gradientFrom: "#f30484",
  gradientTo: "#03b7c0",
  glowColor: "#000000",
  bulgeOnly: true,
};

export const dotFieldWrapperOpacity = 0.28;

export const prismConfig = {
  animationType: "3drotate" as const,
  // Slower than the original 0.45 — the restored version spun fast enough to
  // feel more like a loading spinner than an ambient background.
  timeScale: 0.18,
  scale: 3.0,
  height: 2.8,
  baseWidth: 3.8,
  // Down from 0.25 — less static/grain in the render.
  noise: 0.14,
  glow: 1.0,
  hueShift: 0.35,
  colorFrequency: 3.0,
  // Up from the component's own default of 1.5 — more color, less pastel.
  saturation: 2.1,
  // Ray-march steps per pixel (the shader's dominant cost). Down from the
  // library default of 100 — this scene is glowy/blurred by design, so the
  // lost precision isn't visible, and it's the single biggest lever for FPS.
  steps: 64,
  maxFps: 30,
};
