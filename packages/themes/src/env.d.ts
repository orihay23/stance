// This package has no runtime dependency on Vite (see e.g. crisp.ts's own
// "no runtime dependency on Tailwind" comment for the same philosophy) —
// pulling in the full `vite/client` ambient types for one boolean would add
// an unnecessary devDependency and a lot of irrelevant surface (asset
// imports, import.meta.glob, ...). This declares only the `DEV` flag
// compile.ts's dev-mode deprecation warning needs; consumers that bundle
// with Vite still get the real `import.meta.env.DEV` at runtime.
interface ImportMetaEnv {
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
