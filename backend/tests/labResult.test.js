const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const LabResult = require('../src/models/LabResult');

const validResult = () => ({
  labResultId: 'LAB-001',
  patient: new mongoose.Types.ObjectId(),
  testName: 'HbA1c',
  value: '7.1',
  numericValue: 7.1,
  unit: '%',
  referenceRange: '4.0 - 5.6',
  status: 'High',
  testDate: new Date('2026-08-12'),
  recordedBy: new mongoose.Types.ObjectId()
});

test('accepts a complete structured lab result', async () => {
  const result = new LabResult(validResult());
  await assert.doesNotReject(result.validate());
  assert.equal(result.numericValue, 7.1);
});

test('requires patient, test name, value, date and recorder', async () => {
  const result = new LabResult({ labResultId: 'LAB-002' });
  const errors = await result.validate().then(() => ({}), (error) => error.errors);
  for (const field of ['patient', 'testName', 'value', 'testDate', 'recordedBy']) assert.ok(errors[field]);
});

test('rejects unsupported clinical result statuses', async () => {
  const result = new LabResult({ ...validResult(), status: 'Made Up' });
  const errors = await result.validate().then(() => ({}), (error) => error.errors);
  assert.ok(errors.status);
});

test('defines a patient, test name and date index for trend queries', () => {
  const hasTrendIndex = LabResult.schema.indexes().some(([fields]) => fields.patient === 1 && fields.testName === 1 && fields.testDate === -1);
  assert.equal(hasTrendIndex, true);
});
