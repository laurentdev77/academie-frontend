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
    rollupOptions: {
      // Ignore ALL FullCalendar modules — avoids all resolution errors
      external: (id) => id.startsWith("@fullcalendar/")
    }
  }
});