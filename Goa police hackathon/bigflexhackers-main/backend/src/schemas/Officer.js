const mongoose = require('mongoose');

const officerSchema = new mongoose.Schema({
  officerId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  rank: {
    type: String,
    required: true,
    enum: ['PI', 'PSI', 'ASI', 'HC', 'PC', 'LPC']
  },
  role: {
    type: String,
    required: true,
    enum: ['Officer', 'Supervisor'],
    default: 'Officer'
  },
  homePoliceStation: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  currentStatus: {
    type: String,
    enum: ['On-Duty', 'Off-Duty', 'On-Break'],
    default: 'Off-Duty'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  currentLocation: {
    lat: {
      type: Number
    },
    lon: {
      type: Number
    }
  }
}, {
  timestamps: true
});

// Check if the model already exists to prevent recompilation errors
module.exports = mongoose.models.Officer || mongoose.model('Officer', officerSchema);
