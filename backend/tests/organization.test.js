const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const Department = require('../src/models/Department');
const DoctorLeave = require('../src/models/DoctorLeave');

test('department accepts the supported operational statuses', async () => {
  await assert.doesNotReject(new Department({ departmentId: 'DEP-001', name: 'Cardiology', status: 'Active' }).validate());
  const invalid = new Department({ departmentId: 'DEP-002', name: 'Neurology', status: 'Deleted' });
  await assert.rejects(invalid.validate(), /status/);
});

test('doctor leave requires a doctor, period and reason', async () => {
  const leave = new DoctorLeave({ leaveId: 'LEV-001' });
  const errors = await leave.validate().then(() => ({}), (error) => error.errors);
  for (const field of ['doctor', 'startDate', 'endDate', 'reason']) assert.ok(errors[field]);
});

test('doctor leave accepts a valid pending request', async () => {
  const leave = new DoctorLeave({ leaveId: 'LEV-002', doctor: new mongoose.Types.ObjectId(), startDate: '2026-08-20', endDate: '2026-08-22', reason: 'Annual leave' });
  await assert.doesNotReject(leave.validate());
  assert.equal(leave.status, 'Pending');
});

test('doctor leave rejects unsupported workflow states', async () => {
  const leave = new DoctorLeave({ leaveId: 'LEV-003', doctor: new mongoose.Types.ObjectId(), startDate: '2026-08-20', endDate: '2026-08-22', reason: 'Annual leave', status: 'Processing' });
  await assert.rejects(leave.validate(), /status/);
});
