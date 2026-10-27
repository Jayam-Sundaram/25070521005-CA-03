import test from 'node:test';
import assert from 'node:assert/strict';
import { validateReview, validateRegistration } from '../utils/validate.js';
test('review rating must be 1-10 integer', () => {
  assert.throws(() => validateReview({ rating: 0 }));
  assert.throws(() => validateReview({ rating: 11 }));
  assert.throws(() => validateReview({ rating: 7.5 }));
  assert.equal(validateReview({ rating: 8, reviewText: ' great ' }).reviewText, 'great');
});
test('review text length is capped', () => assert.throws(() => validateReview({ rating: 5, reviewText: 'a'.repeat(2001) })));
test('registration rules', () => {
  assert.throws(() => validateRegistration({ name: 'A', email: 'a@b.co', password: 'abcdefg1' }));
  assert.throws(() => validateRegistration({ name: 'Ann', email: 'bad', password: 'abcdefg1' }));
  assert.throws(() => validateRegistration({ name: 'Ann', email: 'a@b.co', password: 'short1' }));
  assert.doesNotThrow(() => validateRegistration({ name: 'Ann', email: 'a@b.co', password: 'abcdefg1' }));
});
