const mongoose = require('mongoose');
const DepartmentSchema = new mongoose.Schema({
  departmentId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, unique: true, trim: true, index: true },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true }
}, { timestamps: true });
module.exports = mongoose.model('Department', DepartmentSchema);
