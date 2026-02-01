const mongoose = require('mongoose');

const panicAlertSchema = new mongoose.Schema({
  officer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Officer',
    required: true
  },
  location: {
    lat: {
      type: Number,
      required: true
    },
    lon: {
      type: Number,
      required: true
    }
  },
  acknowledgedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Officer',
    required: false
  },
  status: {
    type: String,
    enum: ['Active', 'Acknowledged'],
    default: 'Active'
  }
}, {
  timestamps: true
});

// Check if the model already exists to prevent recompilation errors
module.exports = mongoose.models.PanicAlert || mongoose.model('PanicAlert', panicAlertSchema);
