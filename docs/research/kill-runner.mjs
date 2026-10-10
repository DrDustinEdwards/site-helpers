// Runs every test once under the active mutant and logs which tests failed.
import { spawnSync } from "node:child_process";
import { appendFileSync } from "node:fs";
const r = spawnSync(process.execPath, ["--test", "--test-reporter=tap", "test/prelum.test.mjs"], { encoding: "utf8" });
const failed = [...r.stdout.matchAll(/^not ok \d+ - (.*)$/gm)].map((m) => m[1]);
const id = process.env.__STRYKER_ACTIVE_MUTANT__ ?? "none";
appendFileSync((process.env.OUT ?? ".") + "/" + (process.env.CHUNK ?? "x") + ".matrix.jsonl", JSON.stringify({ id, failed, status: r.status }) + "\n");
process.exit(failed.length || r.status ? 1 : 0);
