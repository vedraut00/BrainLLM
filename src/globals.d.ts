// Allow side-effect CSS imports (e.g. `import "./globals.css"`) under `tsc`.
// Next.js handles these at build time; this keeps the standalone typecheck green.
declare module "*.css";
