import type { Theme } from "../types";

/**
 * "Fun" — soft, approachable personality for consumer-facing contexts:
 * generous radius (verging on pill-shaped for small controls), a roomier
 * spacing scale, and softer, more diffused shadows with visible blur. Base
 * grays are Tailwind's `stone` (warm, vs. neutral's cool `zinc`); `primary`
 * itself is warm-colored (`orange`) rather than monochrome, with `accent`
 * a contrasting warm `rose` for secondary emphasis — a bolder, friendlier
 * departure from neutral's black/white-plus-one-accent pattern. Semantic
 * roles (destructive/success/warning/info) intentionally reuse neutral's
 * exact hues — those meanings shouldn't shift between themes. Every color
 * literal is a value from Tailwind's shipped `stone` / `orange` / `rose` /
 * `red` / `green` / `amber` / `sky` OKLCH scales, inlined so this package
 * has no runtime dependency on Tailwind itself.
 */
export const fun: Theme = {
  name: "fun",

  light: {
    colors: {
      background: "oklch(100% 0 0)", // white
      foreground: "oklch(14.7% 0.004 49.25)", // stone-950
      surface: {
        DEFAULT: "oklch(98.5% 0.001 106.423)", // stone-50
        foreground: "oklch(14.7% 0.004 49.25)", // stone-950
        hover: "oklch(97% 0.001 106.424)", // stone-100
        active: "oklch(92.3% 0.003 48.717)", // stone-200
      },
      overlay: "oklch(0% 0 0 / 0.5)",
      border: "oklch(92.3% 0.003 48.717)", // stone-200
      ring: "oklch(55.3% 0.013 58.071)", // stone-500
      primary: {
        DEFAULT: "oklch(64.6% 0.222 41.116)", // orange-600
        foreground: "oklch(100% 0 0)", // white
        hover: "oklch(55.3% 0.195 38.402)", // orange-700
        active: "oklch(47% 0.157 37.304)", // orange-800
      },
      secondary: {
        DEFAULT: "oklch(97% 0.001 106.424)", // stone-100
        foreground: "oklch(21.6% 0.006 56.043)", // stone-900
        hover: "oklch(92.3% 0.003 48.717)", // stone-200
        active: "oklch(86.9% 0.005 56.366)", // stone-300
      },
      accent: {
        DEFAULT: "oklch(58.6% 0.253 17.585)", // rose-600
        foreground: "oklch(100% 0 0)", // white
        hover: "oklch(51.4% 0.222 16.935)", // rose-700
        active: "oklch(45.5% 0.188 13.697)", // rose-800
      },
      muted: {
        DEFAULT: "oklch(97% 0.001 106.424)", // stone-100
        foreground: "oklch(55.3% 0.013 58.071)", // stone-500
      },
      destructive: {
        DEFAULT: "oklch(57.7% 0.245 27.325)", // red-600
        foreground: "oklch(100% 0 0)", // white
        hover: "oklch(50.5% 0.213 27.518)", // red-700
        active: "oklch(44.4% 0.177 26.899)", // red-800
      },
      success: {
        DEFAULT: "oklch(62.7% 0.194 149.214)", // green-600
        foreground: "oklch(100% 0 0)", // white
        hover: "oklch(52.7% 0.154 150.069)", // green-700
        active: "oklch(44.8% 0.119 151.328)", // green-800
      },
      warning: {
        DEFAULT: "oklch(76.9% 0.188 70.08)", // amber-500
        foreground: "oklch(14.7% 0.004 49.25)", // stone-950 (dark text for AA contrast on amber)
        hover: "oklch(66.6% 0.179 58.318)", // amber-600
        active: "oklch(55.5% 0.163 48.998)", // amber-700
      },
      info: {
        DEFAULT: "oklch(58.8% 0.158 241.966)", // sky-600
        foreground: "oklch(100% 0 0)", // white
        hover: "oklch(50% 0.134 242.749)", // sky-700
        active: "oklch(44.3% 0.11 240.79)", // sky-800
      },
    },
    shadow: {
      // Soft and diffused — visible blur/spread rather than a tight,
      // barely-there edge, for a friendlier, less clinical feel.
      sm: "0 2px 4px 0 oklch(0% 0 0 / 0.06)",
      md: "0 6px 12px -2px oklch(0% 0 0 / 0.12), 0 3px 6px -3px oklch(0% 0 0 / 0.1)",
      lg: "0 14px 20px -4px oklch(0% 0 0 / 0.14), 0 6px 8px -6px oklch(0% 0 0 / 0.1)",
      xl: "0 24px 32px -6px oklch(0% 0 0 / 0.16), 0 10px 12px -8px oklch(0% 0 0 / 0.1)",
    },
  },

  dark: {
    colors: {
      background: "oklch(14.7% 0.004 49.25)", // stone-950
      foreground: "oklch(98.5% 0.001 106.423)", // stone-50
      surface: {
        DEFAULT: "oklch(21.6% 0.006 56.043)", // stone-900
        foreground: "oklch(98.5% 0.001 106.423)", // stone-50
        hover: "oklch(26.8% 0.007 34.298)", // stone-800
        active: "oklch(37.4% 0.01 67.558)", // stone-700
      },
      overlay: "oklch(0% 0 0 / 0.7)",
      border: "oklch(26.8% 0.007 34.298)", // stone-800
      ring: "oklch(70.9% 0.01 56.259)", // stone-400
      primary: {
        DEFAULT: "oklch(75% 0.183 55.934)", // orange-400
        foreground: "oklch(14.7% 0.004 49.25)", // stone-950
        hover: "oklch(83.7% 0.128 66.29)", // orange-300
        active: "oklch(90.1% 0.076 70.697)", // orange-200 (lightest step for :active flash)
      },
      secondary: {
        DEFAULT: "oklch(26.8% 0.007 34.298)", // stone-800
        foreground: "oklch(98.5% 0.001 106.423)", // stone-50
        hover: "oklch(37.4% 0.01 67.558)", // stone-700
        active: "oklch(44.4% 0.011 73.639)", // stone-600
      },
      accent: {
        DEFAULT: "oklch(71.2% 0.194 13.428)", // rose-400
        foreground: "oklch(14.7% 0.004 49.25)", // stone-950
        hover: "oklch(81% 0.117 11.638)", // rose-300
        active: "oklch(89.2% 0.058 10.001)", // rose-200
      },
      muted: {
        DEFAULT: "oklch(26.8% 0.007 34.298)", // stone-800
        foreground: "oklch(70.9% 0.01 56.259)", // stone-400
      },
      destructive: {
        DEFAULT: "oklch(70.4% 0.191 22.216)", // red-400
        foreground: "oklch(14.7% 0.004 49.25)", // stone-950
        hover: "oklch(80.8% 0.114 19.571)", // red-300
        active: "oklch(63.7% 0.237 25.331)", // red-500
      },
      success: {
        DEFAULT: "oklch(79.2% 0.209 151.711)", // green-400
        foreground: "oklch(14.7% 0.004 49.25)", // stone-950
        hover: "oklch(87.1% 0.15 154.449)", // green-300
        active: "oklch(72.3% 0.219 149.579)", // green-500
      },
      warning: {
        DEFAULT: "oklch(82.8% 0.189 84.429)", // amber-400
        foreground: "oklch(14.7% 0.004 49.25)", // stone-950
        hover: "oklch(87.9% 0.169 91.605)", // amber-300
        active: "oklch(92.4% 0.12 95.746)", // amber-200
      },
      info: {
        DEFAULT: "oklch(74.6% 0.16 232.661)", // sky-400
        foreground: "oklch(14.7% 0.004 49.25)", // stone-950
        hover: "oklch(82.8% 0.111 230.318)", // sky-300
        active: "oklch(90.1% 0.058 230.902)", // sky-200
      },
    },
    shadow: {
      sm: "0 2px 4px 0 oklch(0% 0 0 / 0.35)",
      md: "0 6px 12px -2px oklch(0% 0 0 / 0.45), 0 3px 6px -3px oklch(0% 0 0 / 0.4)",
      lg: "0 14px 20px -4px oklch(0% 0 0 / 0.5), 0 6px 8px -6px oklch(0% 0 0 / 0.4)",
      xl: "0 24px 32px -6px oklch(0% 0 0 / 0.55), 0 10px 12px -8px oklch(0% 0 0 / 0.4)",
    },
  },

  radius: {
    // Roughly double neutral's scale — distinctly rounded, verging on
    // pill-shaped for small controls.
    none: "0px",
    sm: "0.5rem",
    md: "0.875rem",
    lg: "1.25rem",
    xl: "1.75rem",
    full: "9999px", // unchanged: functional (circles/pills), not a personality knob
  },

  spacing: {
    // Roomier than neutral for a more generous, breathing-room feel.
    xs: "0.375rem",
    sm: "0.75rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },

  typography: {
    fontFamily: {
      sans: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
    fontSize: {
      xs: "0.8125rem",
      sm: "0.9375rem",
      base: "1.0625rem",
      lg: "1.1875rem",
      xl: "1.375rem",
      "2xl": "1.625rem",
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    lineHeight: {
      tight: "1.35",
      normal: "1.6",
      relaxed: "1.85",
    },
  },
};
