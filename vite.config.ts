import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      external: [
        "@fullcalendar/core",
        "@fullcalendar/core/index.js",
        "@fullcalendar/core/internal",
        "@fullcalendar/react",
        "@fullcalendar/daygrid",
        "@fullcalendar/timegrid",
        "@fullcalendar/interaction",
        "@fullcalendar/list",
        "@fullcalendar/rrule"
      ]
    }
  }
});
