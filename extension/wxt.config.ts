import { defineConfig } from "wxt";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env" });

const APP_URL =
  process.env.APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
const appOriginPattern = `${APP_URL}/*`;

const firefoxBinary = process.env.WEB_EXT_FIREFOX ?? "firefoxdeveloperedition";

export default defineConfig({
  srcDir: ".",
  manifest: {
    name: "Top14 fantasy refresher",
    description:
      "Refresh your fantasy data by calling the lagrandemelee API and uploading to your rugby-fantasy app.",
    permissions: ["storage"],
    host_permissions: [
      "https://lagrandemelee.midi-olympique.fr/*",
      appOriginPattern,
    ],
    browser_specific_settings: {
      gecko: { id: "top14-refresher@local" },
    },
  },
  dev: {
    server: {
      port: 3015,
    },
  },
  runner: {
    binaries: { firefox: firefoxBinary },
    firefoxProfile: ".wxt/rugby-fantasy-profile",
    keepProfileChanges: true,
  },

  vite: () => ({
    define: {
      __APP_URL__: JSON.stringify(APP_URL),
    },
    resolve: {
      alias: {
        "@app": fileURLToPath(new URL("../app", import.meta.url)),
      },
    },
  }),
});
