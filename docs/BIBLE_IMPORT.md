# Verified Scripture imports

Scripture is never translated by AI. Interface locale and content language are independent. English KJV is currently imported and read/searchable from PostgreSQL. Mongolian requires documentary rights for this product, not merely a publicly reachable URL.

## Dataset contract

`packages/shared/src/bible/import.ts` validates version 1 JSON with `translation` (id/name/abbreviation/language/publisher/source URL), a license record (copyright status, license text, evidence URL, attribution, explicit display/download/audio permissions), and books with USFM ids and contiguous chapter/verse records. Imports must contain complete chapters for each book in their declared scope. Verse-count/editorial accuracy still requires source verification: structural validation does not certify a translation's theology or fidelity.

The importer validates the entire document before writes, inserts through one transaction, records a SHA-256 checksum and audit event, and enables the edition only after every verse is inserted. Existing edition ids with different checksums are rejected; publish a new version id instead of overwriting canonical text. Reimporting the exact same file is idempotent. No user records are deleted.

## English KJV

Public-domain evidence: https://ebible.org/eng-kjv2006/copyright.htm (regional restrictions remain subject to review). Dataset: https://github.com/thiagobodruk/bible, `json/en_kjv.json`. Its book labels are Portuguese but its verse text is English; preparation maps canonical book order and validates chapter counts against our 66-book canon. Local input files stay under ignored `.local/bible`.

```powershell
npm.cmd run db:validate
npm.cmd run db:deploy
npm.cmd run prepare:kjv -w @cp/db
npm.cmd run import:bible -w @cp/db -- ../../.local/bible/kjv.json --confirm-rights
```

For your own verified dataset, pass its file path to `import:bible` and confirm rights only after reviewing its evidence. Imported, enabled translations automatically appear in the reader registry. License attribution is returned with every chapter. Neither API.Bible nor MonKJV is automatically granted download rights.

## Search

`/{locale}/bible/search` and `/api/v1/bible/search` support words, exact phrases, book/chapter filters, references, editions and bounded pagination. PostgreSQL uses a generated `simple` tsvector and GIN index; words use exact lexical matching, not English stemming. All query values are parameterized. Remote editions need an authorized import before full-text search becomes available. Personal notes/prayers are never included in search.

## Remaining Bible work

Parallel reading, dedicated completion progress, licensed offline downloads, optional audio, license revocation workflows and translation-version migration remain later slices. The database stores download/audio permissions now; those metadata fields do not imply that a download/audio UI has shipped.
