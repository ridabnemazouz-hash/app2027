# Importing curriculum

The runtime schema is in `packages/core/src/schema.ts`. All levels must be present in a complete bundle. The importer validates localized fields, level range, pinyin character format, source references, unique IDs, cross references, exercise options and required audio for listening questions. Pinyin validation is syntactic: it cannot prove that a reading matches a particular Hanzi or that tones are linguistically correct. Semantic review remains essential.

```sh
npm run curriculum:validate
npx tsx tools/import-curriculum.ts licensed-bundle.json --out data/curriculum/new-edition/content.json
```

Each run writes `data/reports/import-report.json` and exits nonzero on failure. It does not modify the input. `--out` writes normalized validated output. Repeating an identical import yields the same records, not appended duplicates. Prisma seed uses `upsert` keyed by curriculum version, so rerunning does not duplicate bundles. Version IDs are immutable editorial identifiers: use a new version when publishing content changes.

CSV is supported for vocabulary, grammar or characters, with an existing JSON bundle carrying hierarchy and provenance:

```sh
npx tsx tools/import-curriculum.ts reviewed-words.csv --manifest bundle.json --type vocabulary --out merged-bundle.json
```

CSV column names match item fields. Encode nested arrays and objects as JSON inside RFC 4180 quoted cells (escape each inner quote by doubling it). `level` and `strokeCount` are numeric; audio/stroke/radical nulls are the literal `null`. Translation JSON must contain all four keys `en`, `zh`, `ar`, `es`; examples include Chinese, tone-marked pinyin, all translations and nullable audio. See `data/curriculum/example-vocabulary.csv` for a generated round-trip example.

Duplicate IDs inside a CSV are errors. Existing bundle items with the same ID are replaced, making corrected repeat imports idempotent. Dangling lesson references or invalid output block the entire result. Duplicate vocabulary spellings at the same target level are rejected unless their pinyin differs; represent alternate meanings within the same entry where appropriate.

Before distributing imported material, record source URL, publisher, edition, retrieval date, license, validation state and any review notes. `verified` is an editorial decision requiring evidence, not a status conferred by passing schema validation. Do not automatically mark sourced data verified.
