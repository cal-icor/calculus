// Bundle each demo into one self-contained ES module. MyST's {anywidget}
// directive copies only the file it names, so local imports must be inlined.

import * as esbuild from "esbuild";
import { mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const sourceDirectory = path.join(here, "src", "demos");
const outputDirectory = path.join(here, "..", "content", "_widgets");
const arguments_ = process.argv.slice(2);
const watch = arguments_.includes("--watch");
const requested = arguments_.filter((argument) => !argument.startsWith("--"));

const available = readdirSync(sourceDirectory)
  .filter((file) => file.endsWith(".js"))
  .map((file) => file.slice(0, -3));

const unknown = requested.filter((name) => !available.includes(name));
if (unknown.length) {
  console.error(`Unknown demo(s): ${unknown.join(", ")}. Available: ${available.join(", ")}`);
  process.exit(1);
}

const names = requested.length ? requested : available;
mkdirSync(outputDirectory, { recursive: true });

const options = {
  entryPoints: names.map((name) => ({
    in: path.join(sourceDirectory, `${name}.js`),
    out: name,
  })),
  outdir: outputDirectory,
  bundle: true,
  format: "esm",
  target: "es2020",
  minify: !watch,
  legalComments: "none",
  logLevel: "info",
};

if (watch) {
  const context = await esbuild.context(options);
  await context.watch();
} else {
  await esbuild.build(options);
}
