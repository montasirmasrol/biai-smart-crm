import test from 'node:test'
import assert from 'node:assert/strict'

import {
  detectCustomerLanguage,
  getReplyLanguageInstruction,
} from './reply-helpers.js'

test('detectCustomerLanguage identifies Bangla messages', () => {
  assert.equal(detectCustomerLanguage('আমার একটা বুটক্যাম্পে আগ্রহ আছে।'), 'Bangla')
})

test('detectCustomerLanguage identifies Banglish messages', () => {
  assert.equal(detectCustomerLanguage('Ami apnader bootcamp e join korte chai.'), 'Banglish')
})

test('English business language is not misclassified as Banglish', () => {
  assert.equal(detectCustomerLanguage('I am interested in your training. Please call me.'), 'English')
})

test('detectCustomerLanguage distinguishes Bengali script from Banglish', () => {
  assert.equal(detectCustomerLanguage('আমি আপনাদের বুটক্যাম্পে ভর্তি হতে চাই।'), 'Bangla')
  assert.equal(detectCustomerLanguage('Ami apnader bootcamp e join korte chai.'), 'Banglish')
})

test('reply instructions preserve the correct script', () => {
  assert.match(getReplyLanguageInstruction('Banglish'), /Latin\/Roman letters only/)
  assert.match(getReplyLanguageInstruction('Bangla'), /Bengali script/)
  assert.match(getReplyLanguageInstruction('English'), /natural English/)
})
