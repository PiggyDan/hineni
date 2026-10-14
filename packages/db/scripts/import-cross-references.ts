/**
 * Imports the OpenBible.info cross-reference dataset (CC BY — attribution is shown in the UI).
 *   npm run import:xrefs -w @cp/db [-- path/to/cross_references.txt]
 * Without a path it downloads https://a.openbible.info/data/cross-references.zip.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BIBLE_BOOKS } from "@cp/shared";
import { prisma } from "../src";

const OSIS = (
  "Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song " +
  "Isa Jer Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom " +
  "1Cor 2Cor Gal Eph Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev"
).split(" ");
const toUsfm = new Map(OSIS.map((o, i) => [o, BIBLE_BOOKS[i]!.id]));
const MIN_VOTES = 2;

async function load(path?: string): Promise<string> {
  if (path) return readFileSync(path, "utf8");
  const dir = mkdtempSync(join(tmpdir(), "xrefs-"));
  const res = await fetch("https://a.openbible.info/data/cross-references.zip");
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  writeFileSync(join(dir, "cr.zip"), Buffer.from(await res.arrayBuffer()));
  execFileSync("tar", ["-xf", "cr.zip"], { cwd: dir }); // bsdtar (Windows/macOS) and GNU tar read zip
  return readFileSync(join(dir, "cross_references.txt"), "utf8");
}

function ref(osis: string) {
  const [b, c, v] = osis.split(".");
  const bookId = toUsfm.get(b!);
  return bookId ? { bookId, chapter: Number(c), verse: Number(v) } : null;
}

async function main() {
  const text = await load(process.argv[2]);
  const rows: { bookId: string; chapter: number; verse: number; toKey: string; votes: number }[] = [];
  for (const line of text.split("\n").slice(1)) {
    const [from, to, votesRaw] = line.trim().split("\t");
    const votes = Number(votesRaw);
    if (!from || !to || !(votes >= MIN_VOTES)) continue;
    const f = ref(from);
    const [startRaw, endRaw] = to.split("-");
    const s = ref(startRaw!);
    const e = endRaw ? ref(endRaw) : null;
    if (!f || !s) continue;
    const sameChapter = e && e.bookId === s.bookId && e.chapter === s.chapter && e.verse > s.verse;
    const toKey = `${s.bookId}.${s.chapter}.${s.verse}${sameChapter ? `-${e!.verse}` : ""}`;
    rows.push({ ...f, toKey, votes });
  }
  await prisma.$transaction([prisma.crossReference.deleteMany()]);
  for (let i = 0; i < rows.length; i += 5000) {
    await prisma.crossReference.createMany({ data: rows.slice(i, i + 5000) });
  }
  console.log(`Imported ${rows.length} cross-references (votes ≥ ${MIN_VOTES}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
