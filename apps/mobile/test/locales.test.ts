import test from 'node:test';
import assert from 'node:assert/strict';
import messages from '../src/messages.json';
import { contentLocaleFor, localeSchema } from '../../../packages/core/src';

const locales = ['en', 'zh', 'ar', 'es', 'fr', 'ja'] as const;

test('every interface locale has exactly the English message keys', () => {
  const enKeys = Object.keys(messages.en).sort();
  assert.ok(enKeys.length > 300, 'English message catalogue should be complete');
  for (const locale of locales) {
    const dict = (messages as Record<string, Record<string, string>>)[locale];
    assert.ok(dict, `missing locale ${locale}`);
    assert.deepEqual(Object.keys(dict).sort(), enKeys, `${locale} key parity`);
    for (const [key, value] of Object.entries(dict))
      assert.ok(value.trim().length > 0, `${locale}.${key} must not be empty`);
  }
});

test('preference locale schema accepts all six interface locales', () => {
  for (const locale of locales) assert.equal(localeSchema.parse(locale), locale);
});

test('content fallback maps fr/ja to English and keeps content locales unchanged', () => {
  assert.equal(contentLocaleFor('fr'), 'en');
  assert.equal(contentLocaleFor('ja'), 'en');
  assert.equal(contentLocaleFor('en'), 'en');
  assert.equal(contentLocaleFor('zh'), 'zh');
  assert.equal(contentLocaleFor('ar'), 'ar');
  assert.equal(contentLocaleFor('es'), 'es');
});
