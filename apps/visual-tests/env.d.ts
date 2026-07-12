// @stance/themes ships TS source directly (no build step), so its
// compile.ts — which reads `import.meta.env.DEV` for a dev-mode-only
// deprecation warning — becomes part of this package's own typecheck
// program when imported. This mirrors packages/themes/src/env.d.ts (see
// that file's comment for why a full `vite/client` dependency isn't used
// here either) rather than assuming it as a transitive dependency.
interface ImportMetaEnv {
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
