const mongoose = require("mongoose");

const billSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },

  name: { type: String, required: true },
  service: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },

  bookingTime: { type: Date, required: true },

  phone: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\+?[0-9]{7,15}$/.test(v); // Basic phone format
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },

  area: { type: String, required: true },

  barberId: { type: mongoose.Schema.Types.ObjectId, ref: "Barber", required: true },

  generatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Bill", billSchema);
