import path from "path";
import { defineConfig, type UserConfig, type Plugin } from "vite";
import { ViteMinifyPlugin } from "vite-plugin-minify";

export const removeConsolePlugin = (): Plugin => ({
  name: "vite-plugin-remove-console", // Plugin name
  enforce: "pre", // Run this before other plugins
  transform(code, id) {
    // only on PROD
    if (process.env.NODE_ENV !== "production") {
      return null;
    }

    // Only transform JavaScript/TypeScript files
    if (/\.(?:js|ts)$/.test(id)) {
      // Remove console.log statements
      const transformedCode = code.replace(
        /console\.(?:log|debug|info|warn|error|clear)\((?:.*)\);?/g,
        ""
      );
      return {
        code: transformedCode,
        map: null, // Let Vite handle source maps
      };
    }
    return null; // Return null for non-JS/TS files
  },
});

export default defineConfig({
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      minify: true,
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true,
      loader: {
        ".html": "text",
      },
    },
  },
  esbuild: {
    format: "esm",
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },
  build: {
    minify: "esbuild",
  },
  preview: {},
  server: {
    hmr: true,
    host: true,
  },
  plugins: [ViteMinifyPlugin(), removeConsolePlugin()],
} satisfies UserConfig);
