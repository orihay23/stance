import type { Theme } from "../types";

/**
 * "Crisp" — a clean, modern SaaS-dashboard personality modeled on PrimeVue's
 * Aura theme: a moderate, in-between radius scale (Aura's own 4/6/8/12px
 * steps — sharper than neutral's 8/12/16px, softer than serious's
 * near-square 2/4/6/8px), a colored `primary` (Aura's signature emerald,
 * not neutral/serious's monochrome black/white) paired with a cool cyan
 * `accent`, and a slightly denser spacing scale than neutral's. Shadows
 * intentionally stay close to neutral's — Aura itself is built on
 * standard/unremarkable drop-shadow values, so the personality here lives
 * in color, radius, and density rather than shadow shape. Base grays are
 * Tailwind's `gray` (the one first-party gray family not already used by
 * neutral/zinc, serious/slate, or fun/stone). Semantic roles
 * (destructive/success/warning/info) intentionally reuse neutral's exact
 * hues — those meanings shouldn't shift between themes. Every color
 * literal is a value from Tailwind's shipped `gray` / `emerald` / `cyan` /
 * `red` / `green` / `amber` / `sky` OKLCH scales, inlined so this package
 * has no runtime dependency on Tailwind itself.
 */
export const crisp: Theme = {
  name: "crisp",

  light: {
    colors: {
      background: "oklch(100% 0 0)", // white
      foreground: "oklch(13% 0.028 261.692)", // gray-950
      surface: {
        DEFAULT: "oklch(98.5% 0.002 247.839)", // gray-50
        foreground: "oklch(13% 0.028 261.692)", // gray-950
        hover: "oklch(96.7% 0.003 264.542)", // gray-100
        active: "oklch(92.8% 0.006 264.531)", // gray-200
      },
      overlay: "oklch(0% 0 0 / 0.5)",
      border: "oklch(92.8% 0.006 264.531)", // gray-200
      ring: "oklch(55.1% 0.027 264.364)", // gray-500
      primary: {
        DEFAULT: "oklch(59.6% 0.145 163.225)", // emerald-600
        foreground: "oklch(100% 0 0)", // white
        hover: "oklch(50.8% 0.118 165.612)", // emerald-700
        active: "oklch(43.2% 0.095 166.913)", // emerald-800
      },
      secondary: {
        DEFAULT: "oklch(96.7% 0.003 264.542)", // gray-100
        foreground: "oklch(21% 0.034 264.665)", // gray-900
        hover: "oklch(92.8% 0.006 264.531)", // gray-200
        active: "oklch(87.2% 0.01 258.338)", // gray-300
      },
      accent: {
        DEFAULT: "oklch(60.9% 0.126 221.723)", // cyan-600
        foreground: "oklch(100% 0 0)", // white
        hover: "oklch(52% 0.105 223.128)", // cyan-700
        active: "oklch(45% 0.085 224.283)", // cyan-800
      },
      muted: {
        DEFAULT: "oklch(96.7% 0.003 264.542)", // gray-100
        foreground: "oklch(55.1% 0.027 264.364)", // gray-500
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
        foreground: "oklch(13% 0.028 261.692)", // gray-950 (dark text for AA contrast on amber)
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
      sm: "0 1px 2px 0 oklch(0% 0 0 / 0.05)",
      md: "0 4px 6px -1px oklch(0% 0 0 / 0.1), 0 2px 4px -2px oklch(0% 0 0 / 0.1)",
      lg: "0 10px 15px -3px oklch(0% 0 0 / 0.1), 0 4px 6px -4px oklch(0% 0 0 / 0.1)",
      xl: "0 20px 25px -5px oklch(0% 0 0 / 0.1), 0 8px 10px -6px oklch(0% 0 0 / 0.1)",
    },
  },

  dark: {
    colors: {
      background: "oklch(13% 0.028 261.692)", // gray-950
      foreground: "oklch(98.5% 0.002 247.839)", // gray-50
      surface: {
        DEFAULT: "oklch(21% 0.034 264.665)", // gray-900
        foreground: "oklch(98.5% 0.002 247.839)", // gray-50
        hover: "oklch(27.8% 0.033 256.848)", // gray-800
        active: "oklch(37.3% 0.034 259.733)", // gray-700
      },
      overlay: "oklch(0% 0 0 / 0.7)",
      border: "oklch(27.8% 0.033 256.848)", // gray-800
      ring: "oklch(70.7% 0.022 261.325)", // gray-400
      primary: {
        DEFAULT: "oklch(76.5% 0.177 163.223)", // emerald-400
        foreground: "oklch(13% 0.028 261.692)", // gray-950
        hover: "oklch(84.5% 0.143 164.978)", // emerald-300
        active: "oklch(90.5% 0.093 164.15)", // emerald-200 (lightest step for :active flash)
      },
      secondary: {
        DEFAULT: "oklch(27.8% 0.033 256.848)", // gray-800
        foreground: "oklch(98.5% 0.002 247.839)", // gray-50
        hover: "oklch(37.3% 0.034 259.733)", // gray-700
        active: "oklch(44.6% 0.03 256.802)", // gray-600
      },
      accent: {
        DEFAULT: "oklch(78.9% 0.154 211.53)", // cyan-400
        foreground: "oklch(13% 0.028 261.692)", // gray-950
        hover: "oklch(86.5% 0.127 207.078)", // cyan-300
        active: "oklch(91.7% 0.08 205.041)", // cyan-200
      },
      muted: {
        DEFAULT: "oklch(27.8% 0.033 256.848)", // gray-800
        foreground: "oklch(70.7% 0.022 261.325)", // gray-400
      },
      destructive: {
        DEFAULT: "oklch(70.4% 0.191 22.216)", // red-400
        foreground: "oklch(13% 0.028 261.692)", // gray-950
        hover: "oklch(80.8% 0.114 19.571)", // red-300
        active: "oklch(63.7% 0.237 25.331)", // red-500
      },
      success: {
        DEFAULT: "oklch(79.2% 0.209 151.711)", // green-400
        foreground: "oklch(13% 0.028 261.692)", // gray-950
        hover: "oklch(87.1% 0.15 154.449)", // green-300
        active: "oklch(72.3% 0.219 149.579)", // green-500
      },
      warning: {
        DEFAULT: "oklch(82.8% 0.189 84.429)", // amber-400
        foreground: "oklch(13% 0.028 261.692)", // gray-950
        hover: "oklch(87.9% 0.169 91.605)", // amber-300
        active: "oklch(92.4% 0.12 95.746)", // amber-200
      },
      info: {
        DEFAULT: "oklch(74.6% 0.16 232.661)", // sky-400
        foreground: "oklch(13% 0.028 261.692)", // gray-950
        hover: "oklch(82.8% 0.111 230.318)", // sky-300
        active: "oklch(90.1% 0.058 230.902)", // sky-200
      },
    },
    shadow: {
      sm: "0 1px 2px 0 oklch(0% 0 0 / 0.3)",
      md: "0 4px 6px -1px oklch(0% 0 0 / 0.4), 0 2px 4px -2px oklch(0% 0 0 / 0.4)",
      lg: "0 10px 15px -3px oklch(0% 0 0 / 0.4), 0 4px 6px -4px oklch(0% 0 0 / 0.4)",
      xl: "0 20px 25px -5px oklch(0% 0 0 / 0.4), 0 8px 10px -6px oklch(0% 0 0 / 0.4)",
    },
  },

  radius: {
    // Aura's own scale verbatim (none/4px/6px/8px/12px) — between neutral's
    // and serious's.
    none: "0px",
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    full: "9999px", // unchanged: functional (circles/pills), not a personality knob
  },

  spacing: {
    // Slightly denser than neutral, roomier than serious — a "comfortable
    // dashboard" density in between the two.
    xs: "0.25rem",
    sm: "0.5rem",
    md: "0.625rem",
    lg: "0.875rem",
    xl: "1.25rem",
  },

  typography: {
    fontFamily: {
      sans: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    lineHeight: {
      tight: "1.25",
      normal: "1.5",
      relaxed: "1.75",
    },
  },
};
