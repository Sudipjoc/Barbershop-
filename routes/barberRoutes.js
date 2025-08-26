const express = require("express");

const authMiddleware = require("../middleware/auth");
const Booking = require("../models/Booking");
const Barber = require("../models/Barber");
const Bill = require("../models/Bill");
const Review = require("../models/Review");



module.exports = function (io) {

const router = express.Router();

// Fetch all barbers and their employees
router.get("/barbers", async (req, res) => {
  try {
    const barbers = await Barber.find()
      .populate("employees") // Ensure employees are populated
      .sort({ createdAt: -1 })
      .select("name image location services employees availabilityStatus shopStatus"); // ✅ Added shopStatus

    res.json(barbers); // Send list of barbers
  } catch (error) {
    console.error("Error fetching barbers:", error);
    res.status(500).json({ message: "Error fetching barbers" });
  }
});

// ✅ Get current barber's shop status
router.get("/me/status", authMiddleware, async (req, res) => {
  try {
    const barber = await Barber.findById(req.user.id);
    if (!barber) return res.status(404).json({ message: "Barber not found" });
    res.json({ shopStatus: barber.shopStatus });
  } catch (error) {
    console.error("Error fetching barber status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get barber's own availability
router.get("/me/availability", authMiddleware, async (req, res) => {
  try {
    const barber = await Barber.findById(req.user.id).select("availabilityStatus");
    if (!barber) return res.status(404).json({ message: "Barber not found" });
    res.json({ availabilityStatus: barber.availabilityStatus });
  } catch (error) {
    console.error("Error fetching availability status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ PUT barber's availability status
router.put("/availability", authMiddleware, async (req, res) => {
  try {
    const { availabilityStatus } = req.body;
    if (!["Available", "Busy"].includes(availabilityStatus)) {
      return res.status(400).json({ message: "Invalid availability status" });
    }

    const barber = await Barber.findByIdAndUpdate(
      req.user.id,
      { availabilityStatus },
      { new: true, select: "availabilityStatus name" }
    );

    if (!barber) return res.status(404).json({ message: "Barber not found" });

    res.json({
      message: "Availability status updated",
      availabilityStatus: barber.availabilityStatus,
      barberName: barber.name,
    });
  } catch (error) {
    console.error("Error updating availability status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get any barber's availability by ID
router.get("/:id/availability", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Invalid barber ID" });
    }
    const barber = await Barber.findById(id).select("availabilityStatus name");
    if (!barber) return res.status(404).json({ message: "Barber not found" });
    res.json({ availabilityStatus: barber.availabilityStatus, barberName: barber.name });
  } catch (error) {
    console.error("Error fetching public availability:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update shop status
router.put("/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const barber = await Barber.findByIdAndUpdate(
      req.user.id,
      { shopStatus: status },
      { new: true }
    );
    if (!barber) return res.status(404).json({ message: "Barber not found" });

    res.json({ message: "Shop status updated!", barber });
  } catch (error) {
    console.error("Error updating shop status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get shop status
router.get("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === "undefined") {
      return res.status(400).json({ message: "Invalid barber ID" });
    }
    const barber = await Barber.findById(id);
    if (!barber) return res.status(404).json({ message: "Barber not found!" });
    res.json({ shopStatus: barber.shopStatus });
  } catch (error) {
    console.error("Error fetching status:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Fetch all appointments
router.get("/:barberId/appointments", async (req, res) => {
  try {
    const { barberId } = req.params;
    if (!barberId || barberId === "undefined") {
      return res.status(400).json({ message: "Invalid barber ID" });
    }

    const bookings = await Booking.find({ barber: barberId })
      .populate("user", "username")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

 // Accept appointment
  router.put("/:barberId/acceptAppointment", async (req, res) => {
    const { appointmentId } = req.body;
    try {
      const booking = await Booking.findByIdAndUpdate(
        appointmentId,
        { status: "Confirmed" },
        { new: true }
      ).populate("user barber");

      if (!booking) return res.status(404).json({ message: "Booking not found" });

      // Emit real-time notification to users
      io.emit("appointmentAccepted", {
        userId: booking.user._id.toString(),
        appointmentId: booking._id,
        message: `Your appointment with ${booking.barber.name} has been accepted.`,
      });

      res.json({ message: "Appointment accepted", booking });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Reschedule appointment
  router.put("/:barberId/updateTime", async (req, res) => {
    const { appointmentId, newTime } = req.body;
    try {
      const booking = await Booking.findByIdAndUpdate(
        appointmentId,
        { bookingTime: newTime, status: "Confirmed" },
        { new: true }
      ).populate("user barber");

      if (!booking) return res.status(404).json({ message: "Booking not found" });

      io.emit("appointmentRescheduled", {
        userId: booking.user._id.toString(),
        appointmentId: booking._id,
        newTime: booking.bookingTime,
        message: `Your appointment with ${booking.barber.name} has been rescheduled.`,
      });

      res.json({ message: "Appointment rescheduled", booking });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  });

// ✅ Mark appointment as completed
router.put("/:barberId/markAsDone", async (req, res) => {
  const { appointmentId } = req.body;

  try {
    const booking = await Booking.findByIdAndUpdate(
      appointmentId,
      { status: "Completed" },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: "Appointment not found" });

    res.json({ message: "Appointment marked as completed!" });
  } catch (err) {
    console.error("Error completing appointment:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get Employees
router.get("/employees", authMiddleware, async (req, res) => {
  try {
    const barber = await Barber.findById(req.user.id);
    if (!barber) return res.status(404).json({ msg: "Barber not found." });

    res.json(barber.employees);
  } catch (error) {
    console.error("Fetch Employees Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Add Employee (with file upload)
router.post("/employees/add", authMiddleware, (req, res) => {
  req.upload.single("photo")(req, res, async (err) => {
    if (err) return res.status(400).json({ msg: err.message });

    const { name, job } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !job || !photo) {
      return res.status(400).json({ msg: "Name, job, and photo are required." });
    }

    try {
      const barber = await Barber.findById(req.user.id);
      if (!barber) return res.status(404).json({ msg: "Barber not found." });

      barber.employees.push({ name, job, photo });
      await barber.save();

      res.json({ msg: "Employee added!", employees: barber.employees });
    } catch (error) {
      console.error("Add Employee Error:", error);
      res.status(500).json({ msg: "Server error" });
    }
  });
});

// ✅ Update Employee
router.put("/employees/update/:employeeId", authMiddleware, async (req, res) => {
  try {
    const { name, photo, job } = req.body;
    const barber = await Barber.findById(req.user.id);
    if (!barber) return res.status(404).json({ msg: "Barber not found." });

    const employee = barber.employees.id(req.params.employeeId);
    if (!employee) return res.status(404).json({ msg: "Employee not found." });

    employee.name = name || employee.name;
    employee.photo = photo || employee.photo;
    employee.job = job || employee.job;
    await barber.save();

    res.json({ msg: "Employee updated!", employees: barber.employees });
  } catch (error) {
    console.error("Update Employee Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Delete Employee
router.delete("/employees/delete/:employeeId", authMiddleware, async (req, res) => {
  try {
    const barber = await Barber.findById(req.user.id);
    if (!barber) return res.status(404).json({ msg: "Barber not found." });

    const index = barber.employees.findIndex(emp => emp._id.toString() === req.params.employeeId);
    if (index === -1) return res.status(404).json({ msg: "Employee not found." });

    barber.employees.splice(index, 1);
    await barber.save();

    res.json({ msg: "Employee deleted!", employees: barber.employees });
  } catch (error) {
    console.error("Delete Employee Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});


router.post("/services", authMiddleware, async (req, res) => {
  try {
    console.log("Received body:", req.body); // ✅ Log input

    const { type, price } = req.body;
    if (!type || !price) {
      return res.status(400).json({ msg: "Type and price are required." });
    }

    const barber = await Barber.findById(req.user.id);
    if (!barber) return res.status(404).json({ msg: "Barber not found." });

    barber.services.push({ type, price });
    await barber.save();

    res.json({ msg: "Service added successfully", services: barber.services });
  } catch (error) {
    console.error("Add Service Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/services", authMiddleware, async (req, res) => {
  try {
    const barber = await Barber.findById(req.user.id).select("services");
    if (!barber) return res.status(404).json({ msg: "Barber not found." });
    res.json(barber.services);
  } catch (err) {
    console.error("Fetch Services Error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});


// UPDATE a specific service by index//i have already use this index for editing so thats why i change it here to implement edit functionality
router.put("/services/:index", authMiddleware, async (req, res) => {
  try {
    const { type, price } = req.body;
    const index = parseInt(req.params.index);

    if (!type || price == null) {
      return res.status(400).json({ msg: "Type and price are required." });
    }

    const barber = await Barber.findById(req.user.id);
    if (!barber) return res.status(404).json({ msg: "Barber not found." });

    if (!barber.services[index]) {
      return res.status(404).json({ msg: "Service not found at index." });
    }

    barber.services[index].type = type;
    barber.services[index].price = price;
    await barber.save();

    res.json({ msg: "Service updated successfully", services: barber.services });
  } catch (error) {
    console.error("Update Service Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});

// DELETE a specific service by index //i have already use this index for deleting so thats why i change it here to implement delete functionality
router.delete("/services/:index", authMiddleware, async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const barber = await Barber.findById(req.user.id);
    if (!barber) return res.status(404).json({ msg: "Barber not found." });

    if (!barber.services[index]) {
      return res.status(404).json({ msg: "Service not found at index." });
    }

    barber.services.splice(index, 1); // Remove service
    await barber.save();

    res.json({ msg: "Service deleted successfully", services: barber.services });
  } catch (error) {
    console.error("Delete Service Error:", error);
    res.status(500).json({ msg: "Server error" });
  }
});


router.post("/generate", authMiddleware, async (req, res) => {

  const { bookingId } = req.body;

  try {
    // Check if bill already exists
    const existing = await Bill.findOne({ bookingId });
    if (existing) {
      return res.status(409).json({ message: "Bill already generated" });
    }

    const newBill = new Bill({ ...req.body });
    await newBill.save();

    res.status(201).json({ message: "Bill saved successfully", bill: newBill });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save bill" });
  }
});


// Summary route to fetch appointments count, employee list, and total revenue
router.get("/summary", authMiddleware, async (req, res) => {
  try {
    const barberId = req.user.id;

    // 1. Count total appointments
    const totalAppointments = await Booking.countDocuments({ barber: barberId });

    // 2. Count employees
    const barber = await Barber.findById(barberId).select("employees");
    if (!barber) return res.status(404).json({ message: "Barber not found" });

    const employeeCount = barber.employees.length;

    // 3. Calculate total revenue
    const bills = await Bill.find({ barberId });
    const totalRevenue = bills.reduce((sum, b) => sum + (b.price || 0), 0);

    res.json({
      totalAppointments,
      employeeCount,
      totalRevenue,
    });
  } catch (err) {
    console.error("Error in summary route:", err);
    res.status(500).json({ message: "Server error" });
  }
});



router.get("/barbers/:id/profile", async (req, res) => {
  try {
    const { id } = req.params;

    const barber = await Barber.findById(id)
      .select("name image location shopStatus availabilityStatus services employees")
      .lean();

    if (!barber) return res.status(404).json({ msg: "Barber not found" });

    const reviews = await Review.find({ barber: id })
      .populate("user", "username")
      .populate("booking", "service") // ✅ populate the booking and only select the 'service' field
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      barber,
      reviews,
      employees: barber.employees || [],
    });
  } catch (err) {
    console.error("Barber profile fetch error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});


// ✅ Update Employee Availability
router.put("/employees/:employeeId/availability", authMiddleware, async (req, res) => {
  try {
    const { availabilityStatus } = req.body;  // Either "Available" or "Busy"
    
    if (!["Available", "Busy"].includes(availabilityStatus)) {
      return res.status(400).json({ msg: "Invalid availability status" });
    }

    const barber = await Barber.findById(req.user.id);
    if (!barber) return res.status(404).json({ msg: "Barber not found" });

    const employee = barber.employees.id(req.params.employeeId);
    if (!employee) return res.status(404).json({ msg: "Employee not found" });

    // Update employee's availability status
    employee.availabilityStatus = availabilityStatus;
    await barber.save();

    res.json({ msg: "Employee availability updated", employee });
  } catch (error) {
    console.error("Error updating employee availability:", error);
    res.status(500).json({ msg: "Server error" });
  }
});



return router;
};

