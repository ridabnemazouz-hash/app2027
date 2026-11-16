import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { characterStories } from '../src/character-stories';
import { curriculumSchema, type Curriculum } from '../../../packages/core/src';

const curriculum: Curriculum = curriculumSchema.parse(
  JSON.parse(
    readFileSync(
      new URL('../../../data/curriculum/supplementary-v1/content.json', import.meta.url),
      'utf8',
    ),
  ),
);

test('every stored character has a story with complete localizations', () => {
  assert.equal(curriculum.characters.length, 9);
  assert.equal(characterStories.length, curriculum.characters.length);
  for (const character of curriculum.characters) {
    const story = characterStories.find((s) => s.characterId === character.id);
    assert.ok(story, `missing story for ${character.id} (${character.character})`);
    assert.ok(story.components.length >= 2, 'at least two components');
    for (const comp of story.components) {
      assert.ok(comp.text.length >= 1);
      for (const locale of ['en', 'zh', 'ar', 'es'] as const)
        assert.ok(comp.meaning[locale].trim().length > 0, `${character.id} component ${locale}`);
    }
    for (const locale of ['en', 'zh', 'ar', 'es'] as const)
      assert.ok(story.story[locale].trim().length > 20, `${character.id} story ${locale}`);
  }
});

test('stories never claim verified radical or stroke data the pack does not have', () => {
  for (const character of curriculum.characters) {
    assert.equal(character.radical, null);
    assert.equal(character.strokeCount, null);
    assert.equal(character.strokeOrder, null);
  }
});

test('similar-character rounds always have exactly one correct option in shipped data', () => {
  const ordered = [...curriculum.characters].sort((a, b) => a.level - b.level);
  for (let round = 0; round < ordered.length; round++) {
    const character = ordered[round]!;
    const target = curriculum.vocabulary.find(
      (v) => v.level === character.level && v.simplified.includes(character.character),
    );
    assert.ok(target, `no shipped word contains ${character.character}`);
    const distractors = [1, 2, 3]
      .map((k) => ordered[(round + k * 2) % ordered.length]!)
      .map((other) =>
        curriculum.vocabulary.find(
          (v) => v.level === other.level && v.simplified.includes(other.character),
        ),
      );
    assert.equal(distractors.length, 3);
    for (const d of distractors) {
      assert.ok(d);
      assert.ok(
        !d.simplified.includes(character.character),
        `distractor ${d.simplified} must not contain ${character.character}`,
      );
    }
  }
});
