const mongoose = require('mongoose');

const dutySchema = new mongoose.Schema({
  officer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Officer',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Officer',
    required: true
  },
  status: {
    type: String,
    enum: ['Assigned', 'Active', 'Checkout Pending', 'Completed', 'Cancelled'],
    default: 'Assigned'
  },
  checkInTime: {
    type: Date
  },
  checkOutTime: {
    type: Date
  },
  bandobastName: {
    type: String,
    required: true
  },
  sector: {
    type: String,
    required: true
  },
  zone: {
    type: String,
    required: true
  },
  post: {
    type: String,
    required: true
  },
  currentLocation: {
    lat: {
      type: Number
    },
    lon: {
      type: Number
    }
  },
  isOutsideGeofence: {
    type: Boolean,
    default: false
  },
  timeOutsideGeofenceInSeconds: {
    type: Number,
    default: 0
  },
  lastLocationTimestamp: {
    type: Date
  }
}, {
  timestamps: true
});

// Check if the model already exists to prevent recompilation errors
module.exports = mongoose.models.Duty || mongoose.model('Duty', dutySchema);
