// Merges the per-file Stryker chunks (chunks/*.mutation.json and *.matrix.jsonl
// from the results branch) into the score, per-file table and kill matrix.
// Usage: node docs/research/build-matrix.mjs <chunks-dir> [tests-file]
import { readFileSync, writeFileSync } from "node:fs";

const dir = process.argv[2];
const testsFile = process.argv[3] ?? "test/prelum.test.mjs";
const names = [...readFileSync(testsFile, "utf8").matchAll(/^test\("(.*)", /gm)].map((m) => m[1].replace(/\\"/g, '"'));
// Keep rules: FTS5 escaping, and sitemap and feed validity.
const protectedRe = /^(search: (a quote|operators|only the last)|sitemap:|feeds:|xml: (the sites' feed|a CDATA|escap|dates))/;
const files = ["sitemap", "xml", "feeds", "llms", "search"];
const rows = [];
const kills = new Map(names.map((n) => [n, new Set()]));
for (const f of files) {
  const rep = JSON.parse(readFileSync(`${dir}/${f}.mutation.json`, "utf8"));
  const matrix = new Map(readFileSync(`${dir}/${f}.matrix.jsonl`, "utf8").trim().split("\n").map((l) => JSON.parse(l)).map((r) => [r.id, r]));
  const c = { file: `${f}.mjs`, Killed: 0, Timeout: 0, Survived: 0, NoCoverage: 0, Ignored: 0, CompileError: 0, RuntimeError: 0 };
  for (const m of Object.values(rep.files)[0].mutants) {
    const key = m.status === "NoCoverage" ? "NoCoverage" : m.status;
    c[key] = (c[key] ?? 0) + 1;
    if (m.status === "Killed") for (const t of matrix.get(String(m.id))?.failed ?? []) kills.get(t)?.add(`${f}:${m.id}`);
  }
  rows.push(c);
}
const sum = (k) => rows.reduce((a, r) => a + (r[k] ?? 0), 0);
const valid = (r) => r.Killed + r.Timeout + r.Survived + r.NoCoverage;
const score = (r) => ((100 * (r.Killed + r.Timeout)) / valid(r)).toFixed(2);
const total = { file: "All files" };
for (const k of ["Killed", "Timeout", "Survived", "NoCoverage", "Ignored", "CompileError", "RuntimeError"]) total[k] = sum(k);
const killCount = new Map();
for (const s of kills.values()) for (const m of s) killCount.set(m, (killCount.get(m) ?? 0) + 1);
const tests = names.map((name) => {
  const k = kills.get(name);
  const unique = [...k].filter((m) => killCount.get(m) === 1).length;
  const prot = protectedRe.test(name);
  const kind = k.size === 0 ? "zero-kill" : unique === 0 ? "covered-by-others" : "keep";
  return { name, kills: k.size, uniqueKills: unique, kind, protected: prot, candidate: kind !== "keep" && !prot };
});
writeFileSync(new URL("./kill-matrix.json", import.meta.url), JSON.stringify({ files: rows, total, tests }, null, 2) + "\n");
const out = { rows, total, score: score(total), covered: ((100 * (total.Killed + total.Timeout)) / (total.Killed + total.Timeout + total.Survived)).toFixed(2), tests };
console.log(JSON.stringify({ ...out, rows: rows.map((r) => ({ ...r, valid: valid(r), score: score(r) })) }, null, 1));
