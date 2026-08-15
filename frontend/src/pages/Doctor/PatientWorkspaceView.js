import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  addPatientAllergy, addPatientCondition, addPatientConsultation, addPatientLabResult,
  addPatientMedication, getPatientWorkspace, updatePatientAllergy, updatePatientCondition,
  updatePatientConsultation, updatePatientLabResult, updatePatientMedication
} from '../../api/api';
import { EmptyState, Skeleton, StatusBadge } from '../../components/UI';
import './PatientWorkspace.css';
import './PatientWorkspacePhase1.css';

const TABS = ['Overview', 'Conditions', 'Allergies', 'Medications', 'Appointments', 'Consultations', 'Lab Results', 'Medical Records', 'Timeline', 'AI Assistant'];
const FORMS = {
  Conditions: { conditionName: '', diagnosisDate: '', status: 'Active', severity: 'Unspecified', clinicalNotes: '' },
  Allergies: { allergen: '', allergyType: 'Medication', reaction: '', severity: 'Mild', status: 'Active' },
  Medications: { medicationName: '', dosage: '', frequency: '', route: '', startDate: '', endDate: '', status: 'Active', instructions: '' },
  Consultations: { consultationDate: '', chiefComplaint: '', symptoms: '', clinicalFindings: '', assessment: '', treatmentPlan: '', followUpInstructions: '' },
  'Lab Results': { testName: '', value: '', unit: '', referenceRange: '', status: 'Pending', testDate: '', sourceDocument: '' }
};
const SELECTS = {
  status: [],
  severity: ['Mild', 'Moderate', 'Severe', 'Unspecified'],
  allergyType: ['Medication', 'Food', 'Environmental', 'Other']
};
const STATUS_OPTIONS = {
  Conditions: ['Active', 'Chronic', 'Resolved', 'Under Investigation'], Allergies: ['Active', 'Inactive'],
  Medications: ['Active', 'Completed', 'Discontinued'], 'Lab Results': ['Normal', 'Low', 'High', 'Critical', 'Abnormal', 'Pending']
};
const CREATE = { Conditions: addPatientCondition, Allergies: addPatientAllergy, Medications: addPatientMedication, Consultations: addPatientConsultation, 'Lab Results': addPatientLabResult };
const UPDATE = { Conditions: updatePatientCondition, Allergies: updatePatientAllergy, Medications: updatePatientMedication, Consultations: updatePatientConsultation, 'Lab Results': updatePatientLabResult };
const TITLES = { Conditions: 'conditionName', Allergies: 'allergen', Medications: 'medicationName', Consultations: 'chiefComplaint', 'Lab Results': 'testName' };

const formatDate = (value) => value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not recorded';
const dateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : '';
const labelFor = (key) => key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
const recordDate = (item) => item.testDate || item.recordedDate || item.consultationDate || item.diagnosisDate || item.startDate || item.recordDate || item.createdAt || (item.appointmentDate ? `${item.appointmentDate}T00:00:00` : null);

function ClinicalForm({ tab, value, documents, saving, onChange, onCancel, onSubmit }) {
  const longFields = ['clinicalNotes', 'reaction', 'instructions', 'symptoms', 'clinicalFindings', 'assessment', 'treatmentPlan', 'followUpInstructions'];
  return <form className="clinical-entry-form" onSubmit={onSubmit} aria-label={`${value._id ? 'Edit' : 'Add'} ${tab}`}>
    {Object.entries(value).filter(([key]) => !['_id', 'numericValue'].includes(key)).map(([key, fieldValue]) => {
      if (key === 'sourceDocument') return <label key={key}><span>Source document (optional)</span><select value={fieldValue || ''} onChange={(event) => onChange(key, event.target.value)}><option value="">No linked document</option>{documents.map((document) => <option value={document._id} key={document._id}>{document.filename}</option>)}</select></label>;
      const options = key === 'status' ? STATUS_OPTIONS[tab] : SELECTS[key];
      if (options?.length) return <label key={key}><span>{labelFor(key)}</span><select value={fieldValue || ''} onChange={(event) => onChange(key, event.target.value)}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>;
      if (longFields.includes(key)) return <label className="clinical-form-wide" key={key}><span>{labelFor(key)}</span><textarea value={fieldValue || ''} onChange={(event) => onChange(key, event.target.value)} rows="3" /></label>;
      return <label key={key}><span>{labelFor(key)}</span><input required={['conditionName', 'allergen', 'reaction', 'medicationName', 'dosage', 'frequency', 'chiefComplaint', 'testName', 'value', 'testDate'].includes(key)} value={fieldValue || ''} type={key.toLowerCase().includes('date') ? 'date' : 'text'} onChange={(event) => onChange(key, event.target.value)} /></label>;
    })}
    <div className="clinical-form-actions"><button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button><button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : value._id ? 'Update Record' : 'Save Record'}</button></div>
  </form>;
}

function RecordCard({ tab, item, onEdit }) {
  const title = item[TITLES[tab]];
  return <article className={`clinical-record-card ${tab === 'Allergies' && item.status === 'Active' ? 'clinical-record-warning' : ''}`}>
    <div className="clinical-record-title"><div><small>{item.conditionId || item.allergyId || item.medicationId || item.consultationId || item.labResultId}</small><h3>{title}</h3></div>{item.status && <StatusBadge status={item.status} />}</div>
    {tab === 'Conditions' && <dl><div><dt>Diagnosis date</dt><dd>{formatDate(item.diagnosisDate)}</dd></div><div><dt>Severity</dt><dd>{item.severity}</dd></div><div><dt>Diagnosed by</dt><dd>{item.diagnosedBy?.fullName || 'Authorized clinician'}</dd></div><div className="record-detail-wide"><dt>Clinical notes</dt><dd>{item.clinicalNotes || 'No notes recorded'}</dd></div></dl>}
    {tab === 'Allergies' && <dl><div><dt>Type</dt><dd>{item.allergyType}</dd></div><div><dt>Severity</dt><dd>⚠ {item.severity}</dd></div><div className="record-detail-wide"><dt>Documented reaction</dt><dd>{item.reaction}</dd></div></dl>}
    {tab === 'Medications' && <dl><div><dt>Dose</dt><dd>{item.dosage}</dd></div><div><dt>Frequency</dt><dd>{item.frequency}</dd></div><div><dt>Route</dt><dd>{item.route || 'Not recorded'}</dd></div><div><dt>Period</dt><dd>{formatDate(item.startDate)} – {item.endDate ? formatDate(item.endDate) : 'Ongoing'}</dd></div><div className="record-detail-wide"><dt>Instructions</dt><dd>{item.instructions || 'No instructions recorded'}</dd></div></dl>}
    {tab === 'Consultations' && <dl><div><dt>Date</dt><dd>{formatDate(item.consultationDate)}</dd></div><div><dt>Doctor</dt><dd>{item.doctor?.fullName || 'Authorized clinician'}</dd></div>{['symptoms', 'clinicalFindings', 'assessment', 'treatmentPlan', 'followUpInstructions'].map((key) => <div className="record-detail-wide" key={key}><dt>{labelFor(key)}</dt><dd>{item[key] || 'Not recorded'}</dd></div>)}</dl>}
    {tab === 'Lab Results' && <dl><div><dt>Result</dt><dd className="lab-value">{item.value} {item.unit}</dd></div><div><dt>Reference range</dt><dd>{item.referenceRange || 'Not provided'}</dd></div><div><dt>Test date</dt><dd>{formatDate(item.testDate)}</dd></div><div><dt>Source</dt><dd>{item.sourceDocument?.filename || 'Manually verified result'}</dd></div></dl>}
    <button className="clinical-edit-button" onClick={() => onEdit(item)}>Edit record</button>
  </article>;
}

function LabTrends({ results }) {
  const groups = results.reduce((all, item) => {
    if (Number.isFinite(item.numericValue)) (all[item.testName.toLowerCase()] ||= []).push(item);
    return all;
  }, {});
  const trends = Object.values(groups).filter((items) => items.length >= 2);
  if (!trends.length) return null;
  return <section className="lab-trends" aria-labelledby="lab-trends-title"><div className="clinical-section-head"><div><h2 id="lab-trends-title">Lab Trends</h2><p>Trends are shown only when two or more verified numeric results exist.</p></div></div>{trends.map((items) => {
    const sorted = [...items].sort((a, b) => new Date(a.testDate) - new Date(b.testDate));
    const values = sorted.map((item) => item.numericValue); const min = Math.min(...values); const max = Math.max(...values); const range = max - min || 1;
    return <article className="lab-trend-card" key={items[0].testName}><div><h3>{items[0].testName}</h3><span>{sorted.length} results</span></div><div className="trend-bars">{sorted.map((item) => <div className="trend-point" key={item._id}><span className="trend-value">{item.value}</span><span className="trend-bar" style={{ height: `${28 + ((item.numericValue - min) / range) * 54}px` }}></span><small>{new Date(item.testDate).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}</small></div>)}</div><p>Latest: <strong>{sorted.at(-1).value} {sorted.at(-1).unit}</strong> · {sorted.at(-1).status}</p></article>;
  })}</section>;
}

export default function PatientWorkspaceView() {
  const { patientId } = useParams();
  const [data, setData] = useState(null); const [tab, setTab] = useState('Overview'); const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [form, setForm] = useState(null); const [saving, setSaving] = useState(false); const [timelineFilter, setTimelineFilter] = useState('All');
  const load = useCallback(async () => { setLoading(true); setError(''); try { const response = await getPatientWorkspace(patientId); if (response.success) setData(response.data); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to load the patient workspace.'); } finally { setLoading(false); } }, [patientId]);
  useEffect(() => { load(); }, [load]);
  const filteredTimeline = useMemo(() => (data?.timeline || []).filter((item) => timelineFilter === 'All' || ({ Appointments: 'APPOINTMENT', Documents: 'DOCUMENT', Clinical: ['CONDITION', 'ALLERGY', 'CONSULTATION'], Medication: 'MEDICATION', 'Lab Results': 'LAB_RESULT' }[timelineFilter]?.includes?.(item.type) || ({ Appointments: 'APPOINTMENT', Documents: 'DOCUMENT', Medication: 'MEDICATION', 'Lab Results': 'LAB_RESULT' }[timelineFilter] === item.type))), [data, timelineFilter]);
  if (loading) return <div className="patient-workspace"><Skeleton cards={4} /></div>;
  if (!data) return <div className="patient-workspace"><div className="clinical-error" role="alert"><strong>Patient workspace unavailable</strong><p>{error}</p><button onClick={load}>Try again</button></div></div>;
  const { patient, conditions = [], allergies = [], medications = [], appointments = [], consultations = [], labResults = [], documents = [] } = data;
  const age = patient.dateOfBirth ? Math.max(0, Math.floor((Date.now() - new Date(patient.dateOfBirth)) / 31557600000)) : null;
  const lists = { Conditions: conditions, Allergies: allergies, Medications: medications, Appointments: appointments, Consultations: consultations, 'Lab Results': labResults, 'Medical Records': documents, Timeline: filteredTimeline };
  const editRecord = (item) => { const template = FORMS[tab]; const payload = Object.fromEntries(Object.keys(template).map((key) => [key, key.toLowerCase().includes('date') ? dateInput(item[key]) : (item[key]?._id || item[key] || '')])); setForm({ ...payload, _id: item._id }); window.scrollTo({ top: 240, behavior: 'smooth' }); };
  const submit = async (event) => { event.preventDefault(); setSaving(true); setError(''); setSuccess(''); try { const id = form._id; const payload = Object.fromEntries(Object.entries(form).filter(([key]) => key !== '_id')); await (id ? UPDATE[tab](patientId, id, payload) : CREATE[tab](patientId, payload)); setForm(null); setSuccess(`${tab.slice(0, -1)} ${id ? 'updated' : 'recorded'} successfully.`); await load(); } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to save the clinical record.'); } finally { setSaving(false); } };
  const activeAllergies = allergies.filter((item) => item.status === 'Active'); const activeConditions = conditions.filter((item) => ['Active', 'Chronic'].includes(item.status)); const activeMedications = medications.filter((item) => item.status === 'Active');

  return <main className="patient-workspace fade-in">
    <header className="patient-workspace-head"><div className="patient-workspace-avatar">{patient.profilePicture ? <img src={`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}${patient.profilePicture}`} alt={`${patient.fullName} profile`} /> : patient.fullName.slice(0, 2).toUpperCase()}</div><div><span>VERIFIED PATIENT RECORD</span><h1>{patient.fullName}</h1><p>{patient.patientId} · {age === null ? 'Age not recorded' : `${age} years`} · {patient.gender || 'Gender not recorded'} · Blood group {patient.bloodGroup}</p></div><Link to="/doctor/patients">← All Patients</Link></header>
    {activeAllergies.length > 0 && <section className="allergy-alert" role="alert" aria-label="Active allergy warning"><span aria-hidden="true">⚠</span><div><strong>Active allergy warning</strong><p>{activeAllergies.map((item) => `${item.allergen} (${item.severity}${item.reaction ? `: ${item.reaction}` : ''})`).join(' · ')}</p></div></section>}
    {error && <div className="clinical-error" role="alert">{error}</div>}{success && <div className="clinical-success" role="status">✓ {success}</div>}
    <nav className="clinical-tabs" aria-label="Patient record sections">{TABS.map((item) => <button className={tab === item ? 'active' : ''} aria-current={tab === item ? 'page' : undefined} onClick={() => { setTab(item); setForm(null); setError(''); setSuccess(''); }} key={item}>{item}</button>)}</nav>
    {tab === 'Overview' && <div className="clinical-overview"><section className="clinical-stat-grid" aria-label="Clinical summary"><article><span>Active Conditions</span><strong>{activeConditions.length}</strong></article><article><span>Current Medications</span><strong>{activeMedications.length}</strong></article><article><span>Known Allergies</span><strong>{activeAllergies.length}</strong></article><article><span>Lab Results</span><strong>{labResults.length}</strong></article></section><section className="important-clinical-card"><div className="clinical-card-heading"><span aria-hidden="true">ⓘ</span><div><h2>Important Clinical Information</h2><p>Verified structured information for clinical review</p></div></div><dl><div><dt>Blood Group</dt><dd>{patient.bloodGroup}</dd></div><div className={activeAllergies.length ? 'summary-warning' : ''}><dt>Known Allergies</dt><dd>{activeAllergies.map((item) => `${item.allergen} — ${item.severity}`).join(', ') || 'None recorded'}</dd></div><div><dt>Active Conditions</dt><dd>{activeConditions.map((item) => item.conditionName).join(', ') || 'None recorded'}</dd></div><div><dt>Current Medications</dt><dd>{activeMedications.length} active{activeMedications.length ? ` — ${activeMedications.map((item) => item.medicationName).join(', ')}` : ''}</dd></div></dl><p className="clinical-governance-note">This information is entered by authorized healthcare professionals. AI output cannot modify the verified patient record.</p></section></div>}
    {tab === 'AI Assistant' && <section className="clinical-ai"><span className="clinical-ai-icon" aria-hidden="true">✦</span><h2>Patient-scoped Clinical Assistant</h2><p>Retrieve and summarize evidence from this patient’s available records. Responses require professional review and are not diagnoses or clinical orders.</p><Link to="/doctor/chat" state={{ patientId: patient.patientId }}>Open AI Assistant</Link></section>}
    {tab === 'Medications' && <div className="medication-summary"><span>{activeMedications.length} current</span><span>{medications.filter((item) => item.status !== 'Active').length} historical</span></div>}
    {tab === 'Lab Results' && <LabTrends results={labResults} />}
    {!['Overview', 'AI Assistant'].includes(tab) && <section className="clinical-record-section"><div className="clinical-section-head"><div><h2>{tab}</h2><p>Verified records associated with {patient.fullName}.</p></div>{FORMS[tab] && <button onClick={() => setForm({ ...FORMS[tab] })}>+ Add {tab === 'Lab Results' ? 'Lab Result' : tab.slice(0, -1)}</button>}</div>
      {form && <ClinicalForm tab={tab} value={form} documents={documents} saving={saving} onChange={(key, value) => setForm((current) => ({ ...current, [key]: value }))} onCancel={() => setForm(null)} onSubmit={submit} />}
      {tab === 'Timeline' && <div className="timeline-filters" aria-label="Timeline filters">{['All', 'Appointments', 'Documents', 'Clinical', 'Medication', 'Lab Results'].map((filter) => <button className={timelineFilter === filter ? 'active' : ''} onClick={() => setTimelineFilter(filter)} key={filter}>{filter}</button>)}</div>}
      {!lists[tab]?.length ? <EmptyState title={`No ${tab.toLowerCase()} recorded`} message="Verified information will appear here when it is added." /> : tab === 'Timeline' ? <div className="patient-timeline">{lists[tab].map((item, index) => <article key={`${item.type}-${item.date}-${index}`}><span className={`timeline-marker type-${item.type.toLowerCase()}`} aria-hidden="true"></span><div><small>{formatDate(item.date)} · {item.type.replace('_', ' ')}</small><h3>{item.title}</h3><p>{item.detail}</p></div></article>)}</div> : ['Conditions', 'Allergies', 'Medications', 'Consultations', 'Lab Results'].includes(tab) ? <div className="clinical-record-grid">{lists[tab].map((item) => <RecordCard tab={tab} item={item} onEdit={editRecord} key={item._id} />)}</div> : <div className="clinical-record-list">{lists[tab].map((item) => <article key={item._id}><div><strong>{item.filename || item.appointmentId}</strong>{item.status && <StatusBadge status={item.status} />}</div><p>{item.documentType || item.reasonForVisit}</p><small>{formatDate(recordDate(item))}</small></article>)}</div>}
    </section>}
  </main>;
}
