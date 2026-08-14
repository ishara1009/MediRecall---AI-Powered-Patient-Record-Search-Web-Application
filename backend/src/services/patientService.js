const Counter = require('../models/Counter');
const Patient = require('../models/Patient');

const nextId = async (key, prefix) => {
  const counter = await Counter.findByIdAndUpdate(key, { $inc: { sequence: 1 } }, { new: true, upsert: true, setDefaultsOnInsert: true });
  return `${prefix}-${String(counter.sequence).padStart(3, '0')}`;
};

const ensurePatientForUser = async (user) => {
  let patient = await Patient.findOne({ account: user._id });
  if (patient) return patient;
  patient = await Patient.create({
    patientId: await nextId('patient', 'PAT'), fullName: user.fullName,
    email: user.email, phoneNumber: user.phoneNumber,
    profilePicture: user.profilePicture || '', account: user._id
  });
  return patient;
};

module.exports = { nextId, ensurePatientForUser };
