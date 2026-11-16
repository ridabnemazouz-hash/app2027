# Curriculum source audit

Retrieved: **2026-10-28**. No official syllabus content has been imported into the shipped learning pack.

## Primary official sources consulted

1. [Chinese Test Service syllabus page](https://www.chinesetest.cn/syllabus). It identifies HSK 3.0 and offers levels 1–6 and a combined 7–9 selection. Its direct “Examination Syllabus” download linked to `https://hsk.cn-bj.ufileos.com/3.0/新版HSK考试大纲1219.pdf`; this download repeatedly timed out in the research browser. The page's announcement endpoint rendered no article body, so an exam launch date is not inferred from it.
2. [Official vocabulary, character and grammar syllabus PDF](https://hsk.cn-bj.ufileos.com/3.0/新版HSK考试大纲（词汇、汉字、语法）.pdf). The official-domain PDF was readable. Its cover identifies **HSK 考试大纲 / Syllabus for the Chinese Proficiency Test**, issued by **中外语言交流合作中心**, published **2025-11**, implementation **2026-07**. Contents identify separate sections for 1–6 and a combined 七—九级 section for vocabulary, recognition characters and grammar. The source was inspected for edition/structure only; its tables are not bundled or redistributed here.
3. [CTI legal notice](https://www.chinesetest.cn/legal-notice). It asserts copyright and attribution requirements, plus restrictions and exclusions for linked material. Public download availability is not treated as a blanket license to redistribute a commercial curriculum. Permission for this product has not been established.
4. [Official standards/development page](https://www.chinesetest.cn/Development?lang=cn) distinguishes the proficiency standard resources from exam resources. A proficiency standard and an examination syllabus must not be substituted for one another.

## Product interpretation

- Intended future alignment target: the 2025-11 HSK 3.0 **examination syllabus**, implementation printed as 2026-07, versioned separately from the local original pack.
- Do not relabel a legacy HSK 2.0 six-level dataset as this nine-level syllabus.
- Do not treat the 2021 proficiency standard's vocabulary totals as the vocabulary counts of the 2025 exam syllabus. No official totals or exam eligibility requirements are claimed here.
- Framework uses three stages with nine learner targets. Advanced 7, 8 and 9 are separate app study targets with `levelRange:[7,9]` and source range `7-9`, not assertions of three independent official word lists.
- Stage labels “Foundation / Independent / Advanced” and all unit/lesson titles are app labels. Exam scheduling must be checked separately with CTI and the candidate's test centre.

## Supplied pack

The original pack source is `hanzigo-original-v1`, edition 1.0, retrieval/creation date 2026-10-28, license CC BY 4.0 for original educational text. All 36 vocabulary entries, 9 grammar entries and 9 character records are AI-assisted supplementary material requiring independent Mandarin/Arabic/Spanish/English review. Pinyin and translations were written deliberately rather than fetched from an unlicensed corpus, but they are not independently certified.

No stroke counts, radicals, stroke-order paths or verified recording URLs were invented. These fields are null. Character pinyin is stored independently from compound-word pinyin. Speaking/handwriting activities are self-assessed.

To publish an official course, obtain licensed official data, verify mapping against the identified edition, engage qualified language editors, add approved examples/translations/recordings and keep item-level provenance. Replace the pending fields and source status only after that work is complete.

## 2026-10-28 reference expansion

The mobile bundle now includes an independently transcribed 2025 HSK 3.0 vocabulary reference by Gushi, 11,000 entries, licensed CC BY-SA 4.0 with English meanings adapted from CC-CEDICT (same licence). See `data/curriculum/hsk3-gushi-2025/LICENSE.md` for attribution, changes, source link, and rights caveat. This is not an independently verified or official syllabus import. Source edition: 2025-11; official implementation 2026-07; retrieved 2026-10-28. The official advanced band is 7–9; Gushi's separate advanced targets are a study grouping. The source contains 8 repeated headwords with distinct senses, retained to avoid deleting source meanings. Review by qualified linguists remains required.

Counts: 11,000 reference vocabulary entries, plus 36 existing supplementary words; 9 supplementary grammar records, 9 supplementary character records; 9 populated target levels; 9 existing units and 188 application-created reference groups; 18 existing lessons and 920 generated reference lessons; 459 original exercise records and 22,000 generated source-based multiple choice exercises. The reference lessons and exercises are deterministic pedagogical groupings, not official materials. The source has no verified Arabic/Spanish translations, parts of speech or properly attributed examples in this import; none were fabricated. Device Mandarin text-to-speech requires an installed Chinese voice and is distinct from licensed recordings.

Reimport (using the independently obtained original JSON): `node tools/import-gushi.mjs PATH_TO_SOURCE_JSON`. Input count, edition, licence, fields, levels and pinyin syntax are checked; repeated headwords are reported and preserved; output is deterministic. Existing progress identifiers remain unchanged.
