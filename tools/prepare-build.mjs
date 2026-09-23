#!/usr/bin/env node
import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const output = resolve(root, "_site");
if (output === root || !output.endsWith("/_site")) throw new Error("Refusing to clean an unexpected build path.");
await rm(output, { recursive: true, force: true });
console.log(`cleaned=${output}`);
