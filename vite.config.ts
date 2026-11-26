import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { copyFileSync, existsSync } from "fs";
import { resolve } from "path";

// Copy the pdfjs worker to public/ as .js (not .mjs) so servers that don't
// configure a MIME type for .mjs still serve it as application/javascript.
function copyPdfjsWorker() {
  return {
    name: "copy-pdfjs-worker",
    buildStart() {
      const src = resolve("./node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
      const dest = resolve("./public/pdf.worker.min.js");
      if (existsSync(src)) copyFileSync(src, dest);
    },
  };
}

export default defineConfig({
  plugins: [react(), copyPdfjsWorker()],
  server: {
    port: 3000,
  },
});
