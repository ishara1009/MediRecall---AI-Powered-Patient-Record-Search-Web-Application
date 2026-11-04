const User = require('../models/User');
const Patient = require('../models/Patient');
const Condition = require('../models/Condition');
const Allergy = require('../models/Allergy');
const Medication = require('../models/Medication');
const Consultation = require('../models/Consultation');
const LabResult = require('../models/LabResult');
const Appointment = require('../models/Appointment');
const Document = require('../models/Document');
const { ensurePatientForUser, nextId } = require('../services/patientService');
const { sendSuccess, sendError } = require('../utils/response');
const { logAuditEvent } = require('../utils/auditLogger');

const resolvePatient = (patientId) => Patient.findOne({ patientId: String(patientId).toUpperCase() });

const listPatients = async (req, res) => {
  try {
    const users = await User.find({ role: 'User', status: 'active' });
    await Promise.all(users.map(ensurePatientForUser));
    // Link PDFs uploaded before the dedicated Patient collection existed.
    const legacyRecords = await Document.aggregate([
      { $match: { patientId: { $type: 'string', $ne: '' } } },
      { $group: { _id: { $toUpper: '$patientId' }, fullName: { $first: '$patientName' }, profilePicture: { $first: '$patientPhoto' } } }
    ]);
    for (const record of legacyRecords) {
      const patient = await Patient.findOneAndUpdate(
        { patientId: record._id },
        { $setOnInsert: { patientId: record._id, fullName: record.fullName || record._id, profilePicture: record.profilePicture || '' } },
        { new: true, upsert: true, runValidators: true }
      );
      await Document.updateMany(
        { patientId: record._id, patient: null },
        { $set: { patient: patient._id } },
        { collation: { locale: 'en', strength: 2 } }
      );
    }
    const patients = await Patient.find().sort({ fullName: 1 }).lean();
    return sendSuccess(res, patients, 'Patients retrieved successfully');
  } catch (error) { return sendError(res, 'Failed to retrieve patients', 500, error.message); }
};

const getPatientWorkspace = async (req, res) => {
  try {
    const patient = await resolvePatient(req.params.patientId);
    if (!patient) return sendError(res, 'Patient not found', 404);
    const [conditions, allergies, medications, consultations, labResults, documents, appointments] = await Promise.all([
      Condition.find({ patient: patient._id }).populate('diagnosedBy', 'fullName').sort({ createdAt: -1 }).lean(),
      Allergy.find({ patient: patient._id }).populate('recordedBy', 'fullName').sort({ recordedDate: -1 }).lean(),
      Medication.find({ patient: patient._id }).populate('prescribedBy', 'fullName').sort({ createdAt: -1 }).lean(),
      Consultation.find({ patient: patient._id }).populate('doctor', 'fullName employeeId').sort({ consultationDate: -1 }).lean(),
      LabResult.find({ patient: patient._id }).populate('recordedBy', 'fullName').populate('sourceDocument', 'filename customId').sort({ testDate: -1 }).lean(),
      Document.find({ $or: [{ patient: patient._id }, { patientId: patient.patientId }] }).sort({ recordDate: -1 }).lean(),
      patient.account ? Appointment.find({ patient: patient.account }).populate('doctor', 'fullName department').sort({ appointmentDate: -1 }).lean() : []
    ]);
    const timeline = [
      ...conditions.map((x) => ({ type: 'CONDITION', date: x.createdAt, title: `Condition recorded: ${x.conditionName}`, detail: x.status })),
      ...allergies.map((x) => ({ type: 'ALLERGY', date: x.recordedDate, title: `Allergy recorded: ${x.allergen}`, detail: x.severity })),
      ...medications.map((x) => ({ type: 'MEDICATION', date: x.createdAt, title: `Medication added: ${x.medicationName}`, detail: x.status })),
      ...consultations.map((x) => ({ type: 'CONSULTATION', date: x.consultationDate, title: 'Consultation note created', detail: x.doctor?.fullName || '' })),
      ...labResults.map((x) => ({ type: 'LAB_RESULT', date: x.testDate, title: `Lab result: ${x.testName}`, detail: `${x.value}${x.unit ? ` ${x.unit}` : ''} · ${x.status}` })),
      ...documents.map((x) => ({ type: 'DOCUMENT', date: x.recordDate || x.uploadDate, title: `Document uploaded: ${x.filename}`, detail: x.documentType })),
      ...appointments.map((x) => ({ type: 'APPOINTMENT', date: new Date(`${x.appointmentDate}T00:00:00.000Z`), title: `Appointment ${x.status.toLowerCase()}`, detail: x.doctor?.fullName || '' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    await logAuditEvent(req, req.user._id, req.user.fullName, req.user.role, 'PATIENT_RECORD_VIEWED', `Viewed clinical workspace for ${patient.patientId}.`);
    return sendSuccess(res, { patient, conditions, allergies, medications, consultations, labResults, documents, appointments, timeline }, 'Patient workspace retrieved successfully');
  } catch (error) { return sendError(res, 'Failed to retrieve patient workspace', 500, error.message); }
};

const addCondition = async (req, res) => {
  try {
    const patient = await resolvePatient(req.params.patientId);
    if (!patient) return sendError(res, 'Patient not found', 404);
    const { conditionName, diagnosisDate, status, severity, clinicalNotes } = req.body;
    if (!String(conditionName || '').trim()) return sendError(res, 'Condition name is required', 400);
    const condition = await Condition.create({ conditionId: await nextId('condition', 'CON'), patient: patient._id, conditionName, diagnosisDate: diagnosisDate || null, status, severity, clinicalNotes, diagnosedBy: req.user._id });
    await logAuditEvent(req, req.user._id, req.user.fullName, req.user.role, 'CONDITION_CREATED', `Created ${condition.conditionId} for ${patient.patientId}.`);
    return sendSuccess(res, condition, 'Condition recorded successfully', 201);
  } catch (error) { return sendError(res, 'Failed to record condition', 500, error.message); }
};

const updateCondition = async (req, res) => {
  try {
    const allowed = ['conditionName', 'diagnosisDate', 'status', 'severity', 'clinicalNotes'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const patient = await resolvePatient(req.params.patientId);
    if (!patient) return sendError(res, 'Patient not found', 404);
    const condition = await Condition.findOneAndUpdate({ _id: req.params.id, patient: patient._id }, updates, { new: true, runValidators: true });
    if (!condition) return sendError(res, 'Condition not found', 404);
    await logAuditEvent(req, req.user._id, req.user.fullName, req.user.role, 'CONDITION_UPDATED', `Updated ${condition.conditionId} for ${patient.patientId}.`);
    return sendSuccess(res, condition, 'Condition updated successfully');
  } catch (error) { return sendError(res, 'Failed to update condition', 500, error.message); }
};

const addAllergy = async (req, res) => {
  try {
    const patient = await resolvePatient(req.params.patientId);
    if (!patient) return sendError(res, 'Patient not found', 404);
    const { allergen, allergyType, reaction, severity, status } = req.body;
    if (!String(allergen || '').trim() || !String(reaction || '').trim()) return sendError(res, 'Allergen and reaction are required', 400);
    const allergy = await Allergy.create({ allergyId: await nextId('allergy', 'ALG'), patient: patient._id, allergen, allergyType, reaction, severity, status, recordedBy: req.user._id });
    await logAuditEvent(req, req.user._id, req.user.fullName, req.user.role, 'ALLERGY_CREATED', `Created ${allergy.allergyId} for ${patient.patientId}.`);
    return sendSuccess(res, allergy, 'Allergy recorded successfully', 201);
  } catch (error) { return sendError(res, 'Failed to record allergy', 500, error.message); }
};

const addMedication = async (req, res) => {
  try {
    const patient = await resolvePatient(req.params.patientId);
    if (!patient) return sendError(res, 'Patient not found', 404);
    const { medicationName, dosage, frequency, route, startDate, endDate, status, instructions } = req.body;
    if (![medicationName, dosage, frequency].every((value) => String(value || '').trim())) return sendError(res, 'Medication name, dosage and frequency are required', 400);
    const medication = await Medication.create({ medicationId: await nextId('medication', 'MED'), patient: patient._id, medicationName, dosage, frequency, route, startDate, endDate: endDate || null, status, instructions, prescribedBy: req.user._id });
    await logAuditEvent(req, req.user._id, req.user.fullName, req.user.role, 'MEDICATION_CREATED', `Created ${medication.medicationId} for ${patient.patientId}.`);
    return sendSuccess(res, medication, 'Medication recorded successfully', 201);
  } catch (error) { return sendError(res, 'Failed to record medication', 500, error.message); }
};

const addConsultation = async (req, res) => {
  try {
    const patient = await resolvePatient(req.params.patientId);
    if (!patient) return sendError(res, 'Patient not found', 404);
    const { appointment, consultationDate, chiefComplaint, symptoms, clinicalFindings, assessment, treatmentPlan, followUpInstructions } = req.body;
    if (!String(chiefComplaint || '').trim()) return sendError(res, 'Chief complaint is required', 400);
    if (appointment) {
      const validAppointment = await Appointment.exists({ _id: appointment, doctor: req.user._id, patient: patient.account });
      if (!validAppointment) return sendError(res, 'Appointment is not assigned to this doctor and patient', 403);
    }
    const consultation = await Consultation.create({ consultationId: await nextId('consultation', 'CNS'), patient: patient._id, doctor: req.user._id, appointment: appointment || null, consultationDate, chiefComplaint, symptoms, clinicalFindings, assessment, treatmentPlan, followUpInstructions });
    await logAuditEvent(req, req.user._id, req.user.fullName, req.user.role, 'CONSULTATION_CREATED', `Created ${consultation.consultationId} for ${patient.patientId}.`);
    return sendSuccess(res, consultation, 'Consultation note created successfully', 201);
  } catch (error) { return sendError(res, 'Failed to create consultation note', 500, error.message); }
};

const addLabResult = async (req, res) => {
  try {
    const patient = await resolvePatient(req.params.patientId);
    if (!patient) return sendError(res, 'Patient not found', 404);
    const { testName, value, unit, referenceRange, status, testDate, sourceDocument } = req.body;
    if (![testName, value, testDate].every((item) => String(item || '').trim())) return sendError(res, 'Test name, result and test date are required', 400);
    let document = null;
    if (sourceDocument) {
      document = await Document.findOne({ _id: sourceDocument, $or: [{ patient: patient._id }, { patientId: patient.patientId }] });
      if (!document) return sendError(res, 'Source document does not belong to this patient', 403);
    }
    const parsedValue = Number(value);
    const labResult = await LabResult.create({
      labResultId: await nextId('labResult', 'LAB'), patient: patient._id, testName, value, unit,
      numericValue: Number.isFinite(parsedValue) ? parsedValue : null, referenceRange, status,
      testDate, sourceDocument: document?._id || null, recordedBy: req.user._id
    });
    await logAuditEvent(req, req.user._id, req.user.fullName, req.user.role, 'LAB_RESULT_CREATED', `Created ${labResult.labResultId} for ${patient.patientId}.`);
    return sendSuccess(res, labResult, 'Lab result recorded successfully', 201);
  } catch (error) { return sendError(res, 'Failed to record lab result', 500, error.message); }
};

const updateClinicalRecord = (Model, allowed, label, auditAction) => async (req, res) => {
  try {
    const patient = await resolvePatient(req.params.patientId);
    if (!patient) return sendError(res, 'Patient not found', 404);
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    if (Object.prototype.hasOwnProperty.call(updates, 'value')) {
      const parsed = Number(updates.value);
      updates.numericValue = Number.isFinite(parsed) ? parsed : null;
    }
    const record = await Model.findOneAndUpdate({ _id: req.params.id, patient: patient._id }, updates, { new: true, runValidators: true });
    if (!record) return sendError(res, `${label} not found`, 404);
    await logAuditEvent(req, req.user._id, req.user.fullName, req.user.role, auditAction, `Updated ${record[`${label.toLowerCase()}Id`] || record._id} for ${patient.patientId}.`);
    return sendSuccess(res, record, `${label} updated successfully`);
  } catch (error) { return sendError(res, `Failed to update ${label.toLowerCase()}`, 500, error.message); }
};

const updateAllergy = updateClinicalRecord(Allergy, ['allergen', 'allergyType', 'reaction', 'severity', 'status', 'recordedDate'], 'Allergy', 'ALLERGY_UPDATED');
const updateMedication = updateClinicalRecord(Medication, ['medicationName', 'dosage', 'frequency', 'route', 'startDate', 'endDate', 'status', 'instructions'], 'Medication', 'MEDICATION_UPDATED');
const updateConsultation = updateClinicalRecord(Consultation, ['consultationDate', 'chiefComplaint', 'symptoms', 'clinicalFindings', 'assessment', 'treatmentPlan', 'followUpInstructions'], 'Consultation', 'CONSULTATION_UPDATED');
const updateLabResult = updateClinicalRecord(LabResult, ['testName', 'value', 'unit', 'referenceRange', 'status', 'testDate'], 'LabResult', 'LAB_RESULT_UPDATED');

const deleteClinicalRecord = (Model, label, idField, auditAction) => async (req, res) => {
  try {
    const patient = await resolvePatient(req.params.patientId);
    if (!patient) return sendError(res, 'Patient not found', 404);
    const record = await Model.findOneAndDelete({ _id: req.params.id, patient: patient._id });
    if (!record) return sendError(res, `${label} not found`, 404);
    await logAuditEvent(req, req.user._id, req.user.fullName, req.user.role, auditAction, `Deleted ${record[idField] || record._id} for ${patient.patientId}.`);
    return sendSuccess(res, null, `${label} deleted successfully`);
  } catch (error) { return sendError(res, `Failed to delete ${label.toLowerCase()}`, 500, error.message); }
};

const deleteCondition = deleteClinicalRecord(Condition, 'Condition', 'conditionId', 'CONDITION_DELETED');
const deleteAllergy = deleteClinicalRecord(Allergy, 'Allergy', 'allergyId', 'ALLERGY_DELETED');
const deleteMedication = deleteClinicalRecord(Medication, 'Medication', 'medicationId', 'MEDICATION_DELETED');
const deleteConsultation = deleteClinicalRecord(Consultation, 'Consultation', 'consultationId', 'CONSULTATION_DELETED');
const deleteLabResult = deleteClinicalRecord(LabResult, 'Lab result', 'labResultId', 'LAB_RESULT_DELETED');

module.exports = {
  listPatients, getPatientWorkspace,
  addCondition, updateCondition, deleteCondition,
  addAllergy, updateAllergy, deleteAllergy,
  addMedication, updateMedication, deleteMedication,
  addConsultation, updateConsultation, deleteConsultation,
  addLabResult, updateLabResult, deleteLabResult
};
