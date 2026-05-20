import * as path from "path";

const cacheDir = path.resolve(".obsidian-cache");

export const config = {
  runner: "local",
  framework: "mocha",

  specs: ["./test/e2e/**/*.e2e.ts"],

  maxInstances: 1,

  capabilities: [
    {
      browserName: "obsidian",
      browserVersion: "latest",
      "wdio:obsidianOptions": {
        installerVersion: "earliest",
        plugins: ["./test/plugin"],
        vault: "test/vault",
      },
    },
  ],

  services: ["obsidian"],
  reporters: ["obsidian"],

  cacheDir: cacheDir,
  mochaOpts: {
    ui: "bdd",
    timeout: 60_000,
  },
  waitforInterval: 250,
  waitforTimeout: 10_000,
  logLevel: "warn",

  injectGlobals: false,
};
