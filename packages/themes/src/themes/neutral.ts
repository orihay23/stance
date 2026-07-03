import type { Theme } from "../types";

/**
 * "Neutral" — the reference theme: restrained zinc grayscale, a single
 * blue accent used sparingly, standard radius/shadow/density. Every
 * color literal below is a value from Tailwind's shipped `zinc` /
 * `blue` / `red` / `green` / `amber` / `sky` OKLCH scales (see
 * tailwindcss/colors), inlined so this package has no runtime
 * dependency on Tailwind itself.
 */
export const neutral: Theme = {
  name: "neutral",

  light: {
    colors: {
      background: "oklch(100% 0 0)", // white
      foreground: "oklch(14.1% 0.005 285.823)", // zinc-950
      surface: {
        DEFAULT: "oklch(98.5% 0 0)", // zinc-50
        foreground: "oklch(14.1% 0.005 285.823)", // zinc-950
        hover: "oklch(96.7% 0.001 286.375)", // zinc-100
        active: "oklch(92% 0.004 286.32)", // zinc-200
      },
      overlay: "oklch(0% 0 0 / 0.5)",
      border: "oklch(92% 0.004 286.32)", // zinc-200
      ring: "oklch(55.2% 0.016 285.938)", // zinc-500
      primary: {
        DEFAULT: "oklch(21% 0.006 285.885)", // zinc-900
        foreground: "oklch(100% 0 0)", // white
        hover: "oklch(27.4% 0.006 286.033)", // zinc-800
        active: "oklch(14.1% 0.005 285.823)", // zinc-950
      },
      secondary: {
        DEFAULT: "oklch(96.7% 0.001 286.375)", // zinc-100
        foreground: "oklch(21% 0.006 285.885)", // zinc-900
        hover: "oklch(92% 0.004 286.32)", // zinc-200
        active: "oklch(87.1% 0.006 286.286)", // zinc-300
      },
      accent: {
        DEFAULT: "oklch(54.6% 0.245 262.881)", // blue-600
        foreground: "oklch(100% 0 0)", // white
        hover: "oklch(48.8% 0.243 264.376)", // blue-700
        active: "oklch(42.4% 0.199 265.638)", // blue-800
      },
      muted: {
        DEFAULT: "oklch(96.7% 0.001 286.375)", // zinc-100
        foreground: "oklch(55.2% 0.016 285.938)", // zinc-500
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
        foreground: "oklch(14.1% 0.005 285.823)", // zinc-950 (dark text for AA contrast on amber)
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
      background: "oklch(14.1% 0.005 285.823)", // zinc-950
      foreground: "oklch(98.5% 0 0)", // zinc-50
      surface: {
        DEFAULT: "oklch(21% 0.006 285.885)", // zinc-900
        foreground: "oklch(98.5% 0 0)", // zinc-50
        hover: "oklch(27.4% 0.006 286.033)", // zinc-800
        active: "oklch(37% 0.013 285.805)", // zinc-700
      },
      overlay: "oklch(0% 0 0 / 0.7)",
      border: "oklch(27.4% 0.006 286.033)", // zinc-800
      ring: "oklch(70.5% 0.015 286.067)", // zinc-400
      primary: {
        DEFAULT: "oklch(98.5% 0 0)", // zinc-50
        foreground: "oklch(21% 0.006 285.885)", // zinc-900
        hover: "oklch(92% 0.004 286.32)", // zinc-200
        active: "oklch(87.1% 0.006 286.286)", // zinc-300
      },
      secondary: {
        DEFAULT: "oklch(27.4% 0.006 286.033)", // zinc-800
        foreground: "oklch(98.5% 0 0)", // zinc-50
        hover: "oklch(37% 0.013 285.805)", // zinc-700
        active: "oklch(44.2% 0.017 285.786)", // zinc-600
      },
      accent: {
        DEFAULT: "oklch(70.7% 0.165 254.624)", // blue-400
        foreground: "oklch(14.1% 0.005 285.823)", // zinc-950
        hover: "oklch(80.9% 0.105 251.813)", // blue-300
        active: "oklch(90.1% 0.058 230.902)", // sky-200 (lightest step for :active flash)
      },
      muted: {
        DEFAULT: "oklch(27.4% 0.006 286.033)", // zinc-800
        foreground: "oklch(70.5% 0.015 286.067)", // zinc-400
      },
      destructive: {
        DEFAULT: "oklch(70.4% 0.191 22.216)", // red-400
        foreground: "oklch(14.1% 0.005 285.823)", // zinc-950
        hover: "oklch(80.8% 0.114 19.571)", // red-300
        active: "oklch(63.7% 0.237 25.331)", // red-500
      },
      success: {
        DEFAULT: "oklch(79.2% 0.209 151.711)", // green-400
        foreground: "oklch(14.1% 0.005 285.823)", // zinc-950
        hover: "oklch(87.1% 0.15 154.449)", // green-300
        active: "oklch(72.3% 0.219 149.579)", // green-500
      },
      warning: {
        DEFAULT: "oklch(82.8% 0.189 84.429)", // amber-400
        foreground: "oklch(14.1% 0.005 285.823)", // zinc-950
        hover: "oklch(87.9% 0.169 91.605)", // amber-300
        active: "oklch(92.4% 0.12 95.746)", // amber-200
      },
      info: {
        DEFAULT: "oklch(74.6% 0.16 232.661)", // sky-400
        foreground: "oklch(14.1% 0.005 285.823)", // zinc-950
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
    none: "0px",
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    full: "9999px",
  },

  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "0.75rem",
    lg: "1rem",
    xl: "1.5rem",
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
