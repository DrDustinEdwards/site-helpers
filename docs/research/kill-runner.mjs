// Runs every test once under the active mutant and logs which tests failed.
import { spawnSync } from "node:child_process";
import { appendFileSync, readdirSync } from "node:fs";
const files = readdirSync("test").filter((f) => f.endsWith(".test.mjs")).sort().map((f) => `test/${f}`);
const r = spawnSync(process.execPath, ["--test", "--test-reporter=tap", ...files], { encoding: "utf8" });
const failed = [...r.stdout.matchAll(/^not ok \d+ - (.*)$/gm)].map((m) => m[1]);
const id = process.env.__STRYKER_ACTIVE_MUTANT__ ?? "none";
appendFileSync((process.env.OUT ?? ".") + "/" + (process.env.CHUNK ?? "x") + ".matrix.jsonl", JSON.stringify({ id, failed, status: r.status }) + "\n");
process.exit(failed.length || r.status ? 1 : 0);
