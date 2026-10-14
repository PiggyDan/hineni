import { spawn } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const next = require.resolve("next/dist/bin/next");
// A development .env must not turn a production compilation into a development build.
const child = spawn(process.execPath, [next, "build"], { stdio: "inherit", env: { ...process.env, NODE_ENV: "production" } });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
child.on("error", () => { console.error("Unable to start the Next.js production build"); process.exitCode = 1; });
