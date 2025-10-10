import { defineConfig } from "unocss"
import presetWind3 from "@unocss/preset-wind3"

export default defineConfig({
  presets: [presetWind3()],
  theme: {
    colors: {
      background: "#ffffff", // clean white
      primary: "#1e3a8a",    // navy blue (Tailwind's blue-900)
      text: "#111827",       // dark gray for readability
    },
  },
  safelist: [
    "bg-primary",
    "text-primary",
    "hover:bg-primary/90",
  ],
})
