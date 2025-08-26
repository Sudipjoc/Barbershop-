const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: false 
  },

  name: { 
    type: String, 
    required: [true, "Customer name is required."], 
    trim: true 
  },

  phone: { 
    type: String, 
    required: [true, "Phone number is required."], 
    match: [/^\d{10,15}$/, "Invalid phone number format."] 
  },

  bookingTime: { 
    type: Date, 
    required: [true, "Booking time is required."] 
  },

  rescheduledTime: { 
    type: Date, 
    default: null 
  },

  service: { 
    type: String, 
    required: [true, "Service name is required."] 
  },
  

  price: { 
    type: Number, 
    required: [true, "Price is required."], 
    min: [0, "Price must be a positive value."] 
  },

  barber: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Barber", 
    required: [true, "Barber ID is required."] 
  },

  area: { 
    type: String, 
    required: [true, "Area/location is required."] 
  },

  status: { 
    type: String, 
    enum: ["Pending", "Confirmed", "Completed", "Canceled", "Rescheduled"], 
    default: "Pending" 
  },

  completedAt: { 
    type: Date, 
    default: null 
  },

  // === ONLINE PAYMENT FIELDS ===
  paymentReceived: { 
    type: Boolean, 
    default: false 
  },

  // In the Booking schema
paymentMethod: { 
  type: String, 
  enum: ["cash", "esewa"] ,
  default: "cash" 
},
// Add these fields
esewaTransactionUUID: String,
esewaProductCode: { type: String, default: "EPAYTEST" },
esewaSignature: String,
esewaTotalAmount: Number,
esewaStatus: String,


}, { timestamps: true });

// Index to speed up searches for booking conflicts
bookingSchema.index({ bookingTime: 1, barber: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
