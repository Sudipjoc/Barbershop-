const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Booking = require("../models/Booking");
const Barber = require("../models/Barber");
const auth = require("../middleware/auth");
const axios = require("axios");

const https = require("https");

const httpsAgent = new https.Agent({ keepAlive: false });


// ✅ Create a new Booking (User)
router.post("/", auth, async (req, res) => {
  try {
    const { name, phone, bookingTime, service, price, area, barberId } = req.body;

    if (!name || !phone || !bookingTime || !service || !price || !area || !barberId) {
      return res.status(400).json({ msg: "All fields are required." });
    }

    const barber = await Barber.findById(barberId);
    if (!barber) return res.status(404).json({ msg: "Barber not found." });

    const booking = new Booking({
      user: req.user.id,
      name,
      phone,
      bookingTime,
      service,
      price,
      area,
      barber: barberId
    });

    await booking.save();
    res.status(201).json({ msg: "Booking created successfully", booking });
  } catch (error) {
    console.error("Booking Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Get logged-in user's bookings
router.get("/my", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id })
      .populate("barber", "name location")
      .populate("service") 
      .sort({ bookingTime: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Fetching My Bookings Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Get all bookings (Admin / Barber)
router.get("/bookings", auth, async (req, res) => { 
  try {
    const query = req.user.role === "barber" ? { barber: req.user.id } : {};

    const bookings = await Booking.find(query)
      .populate("user", "username")
      .populate("barber", "name")
      .sort({ bookingTime: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Fetching All Bookings Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Update booking status (Confirm, Complete, Cancel)
router.put("/:id/status", auth, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "Invalid booking ID." });
  }

  try {
    const { status } = req.body;
    const validStatuses = ["Pending", "Confirmed", "Completed", "Canceled", "Rescheduled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: "Invalid status." });
    }

    const booking = await Booking.findByIdAndUpdate(id, { status }, { new: true });
    if (!booking) return res.status(404).json({ msg: "Booking not found." });

    res.json({ msg: `Status updated to ${status}`, booking });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Update booking time (Reschedule)
router.put("/:id/time", auth, async (req, res) => {
  const { id } = req.params;
  const { newTime } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "Invalid booking ID." });
  }

  try {
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ msg: "Booking not found." });

    booking.bookingTime = newTime;
    booking.status = "Rescheduled";
    await booking.save();

    res.json({ msg: "Booking rescheduled successfully", booking });
  } catch (error) {
    console.error("Rescheduling Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Get single booking detail
router.get("/:id", auth, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "Invalid booking ID." });
  }

  try {
    const booking = await Booking.findById(id)
      .populate("user", "username")
      .populate("barber", "name");

    if (!booking) return res.status(404).json({ msg: "Booking not found." });

    res.json(booking);
  } catch (error) {
    console.error("Fetch Single Booking Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Delete a booking
router.delete("/:id", auth, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "Invalid booking ID." });
  }

  try {
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) return res.status(404).json({ msg: "Booking not found." });

    res.json({ msg: "Booking deleted successfully" });
  } catch (error) {
    console.error("Delete Booking Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Cancel a booking
router.put("/cancel/:id", auth, async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ msg: "Invalid booking ID." });
  }

  try {
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ msg: "Booking not found." });

    booking.status = "Canceled";
    await booking.save();

    res.json({ msg: "Booking canceled successfully", booking });
  } catch (err) {
    console.error("Cancel Booking Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});


const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');


const generateEsewaSignature = (message, secret) => {
  return crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('base64');
};




// 🟩 POST /esewa-initiate
router.post("/esewa-initiate", auth, async (req, res) => {
  try {
    const { name, phone, bookingTime, service, price, area, barberId } = req.body;

    // Validate input
    if (!name || !phone || !bookingTime || !service || !price || !area || !barberId) {
      return res.status(400).json({ msg: "All fields are required." });
    }

    const barber = await Barber.findById(barberId);
    if (!barber) return res.status(404).json({ msg: "Barber not found." });

    const transaction_uuid = uuidv4();
    const product_code = "EPAYTEST"; // UAT merchant code
    const secret = "8gBm/:&EnhH.1/q"; // UAT shared secret key

    const total_amount = parseFloat(price).toFixed(2); // Ensure two decimal places

    const signed_fields = "total_amount,transaction_uuid,product_code";
    const signaturePayload = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    const signature = generateEsewaSignature(signaturePayload, secret);

    // Save pending booking
    const booking = new Booking({
      user: req.user.id,
      name,
      phone,
      bookingTime,
      service,
      price: parseFloat(total_amount),
      area,
      barber: barberId,
      esewaTransactionUUID: transaction_uuid,
      esewaProductCode: product_code,
      esewaSignature: signature,
      esewaTotalAmount: parseFloat(total_amount),
      paymentMethod: "esewa",
      status: "Pending"
    });

    await booking.save();

    console.log("📦 Booking created:", booking);
    console.log("🔐 Signature payload:", signaturePayload);
    console.log("✅ Signature:", signature);

res.status(200).json({
  amount: total_amount,
  tax_amount: "0",
  total_amount: total_amount,
  transaction_uuid,
  product_code,
  product_service_charge: "0",
  product_delivery_charge: "0",
  success_url: "http://localhost:5000/book/esewa-callback",
  failure_url: "http://localhost:5000/book/esewa-callback",
  signed_field_names: signed_fields,
  signature
});


  } catch (error) {
    console.error("❌ eSewa initiation error:", error);
    res.status(500).json({ msg: "Payment initiation failed" });
  }
});


router.post("/esewa-callback", async (req, res) => {
  try {
    const encodedData = req.body.data;
    if (!encodedData) {
      return res.status(400).send("Missing payment data");
    }

    const decoded = Buffer.from(encodedData, "base64").toString("utf-8");
    const responseData = JSON.parse(decoded);

    const {
      transaction_uuid,
      total_amount,
      product_code,
      signature,
      status
    } = responseData;

    const secret = "8gBm/:&EnhH.1/q";
    const signatureString = `total_amount=${parseFloat(total_amount).toFixed(2)},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
    const computedSignature = generateEsewaSignature(signatureString, secret);

    if (computedSignature !== signature) {
      console.error("❌ Signature mismatch", {
        expected: computedSignature,
        received: signature
      });
      return res.status(400).send("Invalid signature");
    }

    const booking = await Booking.findOne({ esewaTransactionUUID: transaction_uuid });
    if (!booking) return res.status(404).send("Booking not found");

    booking.esewaStatus = status;
    booking.status = status === "COMPLETE" ? "Confirmed" : "Failed";
    await booking.save();

    console.log("🎉 Payment processed:", {
      transaction_uuid,
      status
    });

    res.redirect(status === "COMPLETE" ? "/success" : "/failure");

  } catch (error) {
    console.error("❌ Callback error:", error);
    res.redirect("/failure");
  }
});




module.exports = router;
