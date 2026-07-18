# @stance-dev/themes

Palette and density theme compilers for [`@stance-dev/core`](https://www.npmjs.com/package/@stance-dev/core) —
compiles `ColorPalette`/`DensityProfile` token objects to CSS custom
properties. Required alongside `@stance-dev/core`: core's own compiled CSS has
no color or density values baked in, only `var(--stance-*, fallback)`
references — `@stance-dev/themes` is what actually supplies them.

- **Theming guide**: https://orihay23.github.io/stance/theming.html

Ships 4 first-party color palettes (`neutral`, `serious`, `fun`, `crisp`)
and 4 first-party density profiles (`regular`, `compact`, `relaxed`,
`comfortable`), independently combinable — see the theming guide for the
full palette/density model and the `compilePalettes`/`compileDensityProfiles`
API.

## License

MIT
