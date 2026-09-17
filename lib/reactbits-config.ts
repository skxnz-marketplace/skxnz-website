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
  timeScale: 0.45,
  scale: 3.0,
  height: 2.8,
  baseWidth: 3.8,
  noise: 0.25,
  glow: 1.0,
  hueShift: 0.35,
  colorFrequency: 3.0,
};
