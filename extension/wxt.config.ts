import { defineConfig } from "wxt";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env" });

const firefoxBinary = process.env.WEB_EXT_FIREFOX ?? "firefoxdeveloperedition";

const isProduction = process.env.NODE_ENV === "production";
const devAppUrl =
  process.env.APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
const prodAppUrl = process.env.PROD_APP_URL?.replace(/\/$/, "");

if (isProduction && !prodAppUrl) {
  console.warn(
    `[wxt.config] PROD_APP_URL not set; production build will use APP_URL (${devAppUrl})`,
  );
}

const APP_URL = isProduction && prodAppUrl ? prodAppUrl : devAppUrl;
const appOriginPattern = `${APP_URL}/*`;

export default defineConfig({
  srcDir: ".",
  manifestVersion: 3,
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
      gecko: { id: "top14-refresher@fnb-software" },
      gecko_android: {
        strict_min_version: "120.0",
      },
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
