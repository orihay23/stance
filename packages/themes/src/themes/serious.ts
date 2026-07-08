import type { Theme } from "../types";

/**
 * "Serious" — dense, efficient personality for data-heavy/admin contexts:
 * near-square corners, a compressed spacing scale, and flat/minimal shadows
 * so a screen full of DataTable rows and toolbar controls reads as
 * information-dense rather than sparse. Base grays are Tailwind's `slate`
 * (cooler than neutral's `zinc`); the accent is `indigo` (cooler, more
 * saturated than neutral's `blue`) so it stays legible without feeling loud
 * against dense data. Semantic roles (destructive/success/warning/info)
 * intentionally reuse neutral's exact hues — those meanings shouldn't shift
 * between themes. Every color literal is a value from Tailwind's shipped
 * `slate` / `indigo` / `red` / `green` / `amber` / `sky` OKLCH scales,
 * inlined so this package has no runtime dependency on Tailwind itself.
 */
export const serious: Theme = {
  name: "serious",

  light: {
    colors: {
      background: "oklch(100% 0 0)", // white
      foreground: "oklch(12.9% 0.042 264.695)", // slate-950
      surface: {
        DEFAULT: "oklch(98.4% 0.003 247.858)", // slate-50
        foreground: "oklch(12.9% 0.042 264.695)", // slate-950
        hover: "oklch(96.8% 0.007 247.896)", // slate-100
        active: "oklch(92.9% 0.013 255.508)", // slate-200
      },
      overlay: "oklch(0% 0 0 / 0.5)",
      border: "oklch(92.9% 0.013 255.508)", // slate-200
      ring: "oklch(55.4% 0.046 257.417)", // slate-500
      primary: {
        DEFAULT: "oklch(20.8% 0.042 265.755)", // slate-900
        foreground: "oklch(100% 0 0)", // white
        hover: "oklch(27.9% 0.041 260.031)", // slate-800
        active: "oklch(12.9% 0.042 264.695)", // slate-950
      },
      secondary: {
        DEFAULT: "oklch(96.8% 0.007 247.896)", // slate-100
        foreground: "oklch(20.8% 0.042 265.755)", // slate-900
        hover: "oklch(92.9% 0.013 255.508)", // slate-200
        active: "oklch(86.9% 0.022 252.894)", // slate-300
      },
      accent: {
        DEFAULT: "oklch(51.1% 0.262 276.966)", // indigo-600
        foreground: "oklch(100% 0 0)", // white
        hover: "oklch(45.7% 0.24 277.023)", // indigo-700
        active: "oklch(39.8% 0.195 277.366)", // indigo-800
      },
      muted: {
        DEFAULT: "oklch(96.8% 0.007 247.896)", // slate-100
        foreground: "oklch(55.4% 0.046 257.417)", // slate-500
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
        foreground: "oklch(12.9% 0.042 264.695)", // slate-950 (dark text for AA contrast on amber)
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
      // Deliberately flat — a 1px border reads better than a soft
      // drop-shadow once a screen is full of rows/toolbar controls.
      sm: "0 1px 1px 0 oklch(0% 0 0 / 0.04)",
      md: "0 1px 2px 0 oklch(0% 0 0 / 0.06)",
      lg: "0 2px 4px -1px oklch(0% 0 0 / 0.06)",
      xl: "0 4px 6px -2px oklch(0% 0 0 / 0.08)",
    },
  },

  dark: {
    colors: {
      background: "oklch(12.9% 0.042 264.695)", // slate-950
      foreground: "oklch(98.4% 0.003 247.858)", // slate-50
      surface: {
        DEFAULT: "oklch(20.8% 0.042 265.755)", // slate-900
        foreground: "oklch(98.4% 0.003 247.858)", // slate-50
        hover: "oklch(27.9% 0.041 260.031)", // slate-800
        active: "oklch(37.2% 0.044 257.287)", // slate-700
      },
      overlay: "oklch(0% 0 0 / 0.7)",
      border: "oklch(27.9% 0.041 260.031)", // slate-800
      ring: "oklch(70.4% 0.04 256.788)", // slate-400
      primary: {
        DEFAULT: "oklch(98.4% 0.003 247.858)", // slate-50
        foreground: "oklch(20.8% 0.042 265.755)", // slate-900
        hover: "oklch(92.9% 0.013 255.508)", // slate-200
        active: "oklch(86.9% 0.022 252.894)", // slate-300
      },
      secondary: {
        DEFAULT: "oklch(27.9% 0.041 260.031)", // slate-800
        foreground: "oklch(98.4% 0.003 247.858)", // slate-50
        hover: "oklch(37.2% 0.044 257.287)", // slate-700
        active: "oklch(44.6% 0.043 257.281)", // slate-600
      },
      accent: {
        DEFAULT: "oklch(67.3% 0.182 276.935)", // indigo-400
        foreground: "oklch(12.9% 0.042 264.695)", // slate-950
        hover: "oklch(78.5% 0.115 274.713)", // indigo-300
        active: "oklch(87% 0.065 274.039)", // indigo-200 (lightest step for :active flash)
      },
      muted: {
        DEFAULT: "oklch(27.9% 0.041 260.031)", // slate-800
        foreground: "oklch(70.4% 0.04 256.788)", // slate-400
      },
      destructive: {
        DEFAULT: "oklch(70.4% 0.191 22.216)", // red-400
        foreground: "oklch(12.9% 0.042 264.695)", // slate-950
        hover: "oklch(80.8% 0.114 19.571)", // red-300
        active: "oklch(63.7% 0.237 25.331)", // red-500
      },
      success: {
        DEFAULT: "oklch(79.2% 0.209 151.711)", // green-400
        foreground: "oklch(12.9% 0.042 264.695)", // slate-950
        hover: "oklch(87.1% 0.15 154.449)", // green-300
        active: "oklch(72.3% 0.219 149.579)", // green-500
      },
      warning: {
        DEFAULT: "oklch(82.8% 0.189 84.429)", // amber-400
        foreground: "oklch(12.9% 0.042 264.695)", // slate-950
        hover: "oklch(87.9% 0.169 91.605)", // amber-300
        active: "oklch(92.4% 0.12 95.746)", // amber-200
      },
      info: {
        DEFAULT: "oklch(74.6% 0.16 232.661)", // sky-400
        foreground: "oklch(12.9% 0.042 264.695)", // slate-950
        hover: "oklch(82.8% 0.111 230.318)", // sky-300
        active: "oklch(90.1% 0.058 230.902)", // sky-200
      },
    },
    shadow: {
      sm: "0 1px 1px 0 oklch(0% 0 0 / 0.2)",
      md: "0 1px 2px 0 oklch(0% 0 0 / 0.25)",
      lg: "0 2px 4px -1px oklch(0% 0 0 / 0.25)",
      xl: "0 4px 6px -2px oklch(0% 0 0 / 0.3)",
    },
  },

  radius: {
    // Roughly half of neutral's scale — near-square, not literally 0
    // everywhere, so elements designed to show rounding still read
    // correctly, just sharper.
    none: "0px",
    sm: "0.125rem",
    md: "0.25rem",
    lg: "0.375rem",
    xl: "0.5rem",
    full: "9999px", // unchanged: functional (circles/pills), not a personality knob
  },

  spacing: {
    // Shifted down about one notch from neutral for a denser default feel.
    xs: "0.125rem",
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
  },

  typography: {
    fontFamily: {
      sans: "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
    fontSize: {
      xs: "0.6875rem",
      sm: "0.75rem",
      base: "0.875rem",
      lg: "1rem",
      xl: "1.125rem",
      "2xl": "1.375rem",
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    lineHeight: {
      tight: "1.15",
      normal: "1.35",
      relaxed: "1.5",
    },
  },
};
