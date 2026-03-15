const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: String,
  slot: String,
  vehicleNumber: String,
  date: String,
  verified: { type:Boolean, default:false }
});

module.exports = mongoose.model('Booking', bookingSchema);
