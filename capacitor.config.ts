import type { CapacitorConfig } from "@capacitor/cli";

const productionUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: "com.mdschool.app",
  appName: "Md School",
  webDir: ".output/public",
  bundledWebRuntime: false,
  server: productionUrl ? { url: productionUrl, cleartext: false } : undefined,
};

export default config;
