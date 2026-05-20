#!/usr/bin/env node
import esbuild from "esbuild";
import { builtinModules } from "node:module";

await esbuild.build({
  entryPoints: ["test/plugin/src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron", ...builtinModules],
  format: "cjs",
  target: "es2021",
  outfile: "test/plugin/main.js",
  sourcemap: "inline",
  logLevel: "info",
});
