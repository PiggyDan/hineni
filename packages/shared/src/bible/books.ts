/**
 * Protestant 66-book canon with USFM ids, English versification chapter counts,
 * English names and Mongolian names (as used in common Mongolian Bible editions —
 * have a native-speaking editor verify against the licensed translation you enable).
 */
import translatedNames from "./book-names.json";
import { extraBookNames } from "./book-names-extra";
import { globalBookNames } from "./global-book-names";

export type Testament = "OT" | "NT";

export interface BibleBook {
  id: string;
  order: number;
  testament: Testament;
  chapters: number;
  name: { en: string; mn: string };
  /** Lower-case aliases used by the reference parser (without spaces/dots). */
  aliases: string[];
}

type Row = [id: string, chapters: number, en: string, mn: string, aliases: string];

const rows: Row[] = [
  ["GEN", 50, "Genesis", "Эхлэл", "gen ge gn эх"],
  ["EXO", 40, "Exodus", "Египетээс гарсан нь", "exo ex exod гар египет"],
  ["LEV", 27, "Leviticus", "Левит", "lev le lv лев"],
  ["NUM", 36, "Numbers", "Тооллого", "num nu nm nb тоо"],
  ["DEU", 34, "Deuteronomy", "Дэд хууль", "deu dt deut дэд"],
  ["JOS", 24, "Joshua", "Иошуа", "jos josh jsh иош"],
  ["JDG", 21, "Judges", "Шүүгчид", "jdg judg jg jdgs шүү"],
  ["RUT", 4, "Ruth", "Рут", "rut ru rth"],
  ["1SA", 31, "1 Samuel", "1 Самуел", "1sa 1sam 1sm 1самуел 1сам"],
  ["2SA", 24, "2 Samuel", "2 Самуел", "2sa 2sam 2sm 2самуел 2сам"],
  ["1KI", 22, "1 Kings", "1 Хаад", "1ki 1kgs 1kin 1kings 1хаад"],
  ["2KI", 25, "2 Kings", "2 Хаад", "2ki 2kgs 2kin 2kings 2хаад"],
  ["1CH", 29, "1 Chronicles", "1 Шастир", "1ch 1chr 1chron 1шастир 1шас"],
  ["2CH", 36, "2 Chronicles", "2 Шастир", "2ch 2chr 2chron 2шастир 2шас"],
  ["EZR", 10, "Ezra", "Езра", "ezr ezra"],
  ["NEH", 13, "Nehemiah", "Нехемиа", "neh ne нех"],
  ["EST", 10, "Esther", "Естер", "est esth ест"],
  ["JOB", 42, "Job", "Иов", "job jb"],
  ["PSA", 150, "Psalms", "Дуулал", "psa ps psalm pss psm дуу"],
  ["PRO", 31, "Proverbs", "Сургаалт үгс", "pro prov prv pr сур"],
  ["ECC", 12, "Ecclesiastes", "Номлогчийн үгс", "ecc eccl ec qoh ном"],
  ["SNG", 8, "Song of Songs", "Дууны дуу", "sng song sos songofsolomon songofsongs canticles"],
  ["ISA", 66, "Isaiah", "Исаиа", "isa is иса"],
  ["JER", 52, "Jeremiah", "Иеремиа", "jer je jr иер"],
  ["LAM", 5, "Lamentations", "Гашуудал", "lam la гаш"],
  ["EZK", 48, "Ezekiel", "Езекиел", "ezk eze ezek езе"],
  ["DAN", 12, "Daniel", "Даниел", "dan da dn дан"],
  ["HOS", 14, "Hosea", "Хосеа", "hos ho хос"],
  ["JOL", 3, "Joel", "Иоел", "jol joel jl иоел"],
  ["AMO", 9, "Amos", "Амос", "amo am amos"],
  ["OBA", 1, "Obadiah", "Обадиа", "oba ob obad оба"],
  ["JON", 4, "Jonah", "Иона", "jon jnh jonah"],
  ["MIC", 7, "Micah", "Мика", "mic mi mc"],
  ["NAM", 3, "Nahum", "Нахум", "nam na nah"],
  ["HAB", 3, "Habakkuk", "Хабаккук", "hab hb хаб"],
  ["ZEP", 3, "Zephaniah", "Зефаниа", "zep zeph zp зеф"],
  ["HAG", 2, "Haggai", "Хаггаи", "hag hg хаг"],
  ["ZEC", 14, "Zechariah", "Зехариа", "zec zech zc зех"],
  ["MAL", 4, "Malachi", "Малахи", "mal ml мал"],
  ["MAT", 28, "Matthew", "Матай", "mat matt mt мат"],
  ["MRK", 16, "Mark", "Марк", "mrk mar mk mrk"],
  ["LUK", 24, "Luke", "Лук", "luk lk luke"],
  ["JHN", 21, "John", "Иохан", "jhn jn joh john"],
  ["ACT", 28, "Acts", "Үйлс", "act acts ac элчнарынүйлс"],
  ["ROM", 16, "Romans", "Ром", "rom ro rm"],
  ["1CO", 16, "1 Corinthians", "1 Коринт", "1co 1cor 1коринт 1кор"],
  ["2CO", 13, "2 Corinthians", "2 Коринт", "2co 2cor 2коринт 2кор"],
  ["GAL", 6, "Galatians", "Галат", "gal ga гал"],
  ["EPH", 6, "Ephesians", "Ефес", "eph ephes ефе"],
  ["PHP", 4, "Philippians", "Филиппой", "php phil pp фил"],
  ["COL", 4, "Colossians", "Колоссай", "col co кол"],
  ["1TH", 5, "1 Thessalonians", "1 Тесалоник", "1th 1thess 1thes 1тесалоник 1тес"],
  ["2TH", 3, "2 Thessalonians", "2 Тесалоник", "2th 2thess 2thes 2тесалоник 2тес"],
  ["1TI", 6, "1 Timothy", "1 Тимот", "1ti 1tim 1тимот 1тим"],
  ["2TI", 4, "2 Timothy", "2 Тимот", "2ti 2tim 2тимот 2тим"],
  ["TIT", 3, "Titus", "Тит", "tit ti"],
  ["PHM", 1, "Philemon", "Филемон", "phm phlm philem филем"],
  ["HEB", 13, "Hebrews", "Еврей", "heb he евр"],
  ["JAS", 5, "James", "Иаков", "jas jm jam иак"],
  ["1PE", 5, "1 Peter", "1 Петр", "1pe 1pet 1pt 1петр 1пет"],
  ["2PE", 3, "2 Peter", "2 Петр", "2pe 2pet 2pt 2петр 2пет"],
  ["1JN", 5, "1 John", "1 Иохан", "1jn 1jo 1john 1joh 1иохан"],
  ["2JN", 1, "2 John", "2 Иохан", "2jn 2jo 2john 2joh 2иохан"],
  ["3JN", 1, "3 John", "3 Иохан", "3jn 3jo 3john 3joh 3иохан"],
  ["JUD", 1, "Jude", "Иуда", "jud jude jd иуд"],
  ["REV", 22, "Revelation", "Илчлэл", "rev re rv apocalypse илч"],
];

export const BIBLE_BOOKS: BibleBook[] = rows.map(([id, chapters, en, mn, aliases], i) => ({
  id,
  order: i + 1,
  testament: i < 39 ? "OT" : "NT",
  chapters,
  name: { en, mn },
  aliases: aliases.split(" ").filter(Boolean),
}));

const byId = new Map(BIBLE_BOOKS.map((b) => [b.id, b]));

export const getBook = (id: string): BibleBook | undefined => byId.get(id.toUpperCase());

export const bookName = (id: string, locale: string): string => {
  const book = getBook(id);
  if (!book) return id;
  if (locale === "mn") return book.name.mn;
  return (globalBookNames[locale] ?? (translatedNames as Record<string, string[]>)[locale] ?? extraBookNames[locale])?.[book.order - 1] ?? book.name.en;
};

export const TOTAL_CHAPTERS = BIBLE_BOOKS.reduce((n, b) => n + b.chapters, 0);

/** Returns the next/previous chapter across book boundaries, or null at the ends. */
export function adjacentChapter(
  bookId: string,
  chapter: number,
  direction: 1 | -1,
): { bookId: string; chapter: number } | null {
  const book = getBook(bookId);
  if (!book) return null;
  const next = chapter + direction;
  if (next >= 1 && next <= book.chapters) return { bookId: book.id, chapter: next };
  const neighbour = BIBLE_BOOKS[book.order - 1 + direction];
  if (!neighbour) return null;
  return { bookId: neighbour.id, chapter: direction === 1 ? 1 : neighbour.chapters };
}

/** All chapters of the canon in order — used by reading-plan generators. */
export function allChapters(filter?: (b: BibleBook) => boolean): { bookId: string; chapter: number }[] {
  const out: { bookId: string; chapter: number }[] = [];
  for (const b of BIBLE_BOOKS) {
    if (filter && !filter(b)) continue;
    for (let c = 1; c <= b.chapters; c++) out.push({ bookId: b.id, chapter: c });
  }
  return out;
}
