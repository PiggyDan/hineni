import importedCatalog from "./hymn-catalog.json";

export interface BackgroundHymn {
  id: string; title: string; artist: string; artistUrl: string; src: string;
  source: string; license: string; licenseUrl: string;
}

/** Verified recordings; retain artist credit and license alongside every use. */
export const backgroundHymns: readonly [BackgroundHymn, ...BackgroundHymn[]] = [
  {
    id: "amazing-grace", title: "Amazing Grace 2011", artist: "Kevin MacLeod",
    artistUrl: "https://incompetech.com/",
    src: "/audio/hymns/amazing-grace.mp3",
    source: "https://commons.wikimedia.org/wiki/File:Amazing_Grace_2011_(ISRC_USUAN1100820).mp3",
    license: "CC BY 3.0", licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
  },
  {
    id: "silent-night", title: "Silent Night", artist: "Kevin MacLeod",
    artistUrl: "https://incompetech.com/",
    src: "/audio/hymns/silent-night.mp3",
    source: "https://commons.wikimedia.org/wiki/File:Silent_Night_(ISRC_USUAN1100075).mp3",
    license: "CC BY 3.0", licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
  },
  ...importedCatalog,
];
