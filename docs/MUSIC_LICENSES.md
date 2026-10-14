# Bundled instrumental hymns

Reviewed 2026-10-13. These are licensed recordings of traditional sacred music, not public-domain recordings. Files are unmodified, downloaded from the performer’s official distribution URLs. Preserve the visible credit and license links in the player and this document when redistributing.

## Amazing Grace 2011

- Recording: Kevin MacLeod (incompetech.com), ISRC USUAN1100820; piano, organ and clarinet.
- License: [Creative Commons Attribution 3.0](https://creativecommons.org/licenses/by/3.0/), as documented for this exact recording on [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Amazing_Grace_2011_(ISRC_USUAN1100820).mp3). The current artist listing also offers CC BY 4.0.
- Download: https://incompetech.com/music/royalty-free/mp3-royaltyfree/Amazing%20Grace%202011.mp3
- Local file: `apps/web/public/audio/hymns/amazing-grace.mp3`
- SHA-1: `ee4b779d806b426404e740e74e61beb15e60858d` (matches Commons recording checksum).

## Silent Night

- Recording: Kevin MacLeod (incompetech.com), ISRC USUAN1100075; piano.
- License: [Creative Commons Attribution 3.0](https://creativecommons.org/licenses/by/3.0/), documented on [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Silent_Night_(ISRC_USUAN1100075).mp3).
- Download: https://incompetech.com/music/royalty-free/mp3-royaltyfree/Silent%20Night.mp3
- Local file: `apps/web/public/audio/hymns/silent-night.mp3`
- SHA-1: `35af01267f55489127dc293b361995d5eda13e8d`.

## Player behavior

## AudioTreasure collection — 266 additional recordings

- Provider: AudioTreasure / PublicDomainAudioBibles.com.
- The original provider explicitly states that its hymn files were placed in the public domain: https://audiotreasure.com/mp3/Music/index.htm
- Collection page states recordings were placed in the public domain in 2005 and describes instrumental piano/guitar/strings: https://publicdomainaudiobibles.com/Hymns.html
- Source disclaimer reviewed: https://publicdomainaudiobibles.com/Legal.html (source statement, not a guarantee of worldwide legal status).
- Directory: https://publicdomainaudiobibles.com/content/mp3/Hymns/
- Metadata: `apps/web/src/lib/hymn-catalog.json`. Stable IDs, original filenames, titles, provider attribution, source/dedication links, byte sizes and verification dates are retained for each recording.
- On 2026-10-13 all 266 listed MP3 URLs passed HTTP byte-range and MP3-header checks. These are recording variants; they are not 266 distinct hymn compositions. Listening and full-file integrity verification have not been performed for every recording.
- Audio streams directly from the source after user selection/Play. It is not bulk-downloaded into the repository. The player discloses the external host/internet requirement; source availability can change. The two original Kevin MacLeod recordings remain locally hosted.
- Refresh metadata with `node scripts/import-hymn-catalog.mjs`. Import only succeeds with more than 100 valid audio URLs. Three workers limit request concurrency; failed files are excluded and logged under ignored `.local/`.

## Updated player behavior

The user chooses a recording and presses Play. No autoplay occurs. The player supports title search, previous/next selection, volume and repeat. Selecting another track pauses playback until Play is pressed again. Local file selection remains supported without uploads. No database changes are required.
