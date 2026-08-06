const mongoose = require('mongoose');

const SearchHistorySchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  query: {
    type: String,
    required: true,
    trim: true
  },
  resultsCount: {
    type: Number,
    required: true,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SearchHistory', SearchHistorySchema);
