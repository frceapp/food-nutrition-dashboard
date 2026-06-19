import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Hanya konfigurasi publik ini yang boleh masuk ke bundle browser.
  envPrefix: ["VITE_", "FIREBASE_", "APP_TIMEZONE"],
  server: { port: 5173 },
});
