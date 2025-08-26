// Main server setup
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Export for use in routes
module.exports = { app, server, io };

const PORT = process.env.PORT || 5000;

// Models
const User = require("./models/User");
const Barber = require("./models/Barber");
const Booking = require("./models/Booking");
const Review = require("./models/Review");
const bill = require("./models/Bill");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Support form submissions
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));

// Multer setup (for image uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = ["image/png", "image/jpg", "image/jpeg"];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Invalid file type"));
  }
});

  
// Provide upload middleware for other routes
app.use((req, res, next) => {
  req.upload = upload;
  next();
});

// Socket.IO setup
io.on("connection", (socket) => {
  console.log("✅ A user connected:", socket.id);

  const userId = socket.handshake.auth?.userId;
  if (userId) {
    socket.join(userId); // User joins a room named after their ID
    console.log(`🔔 User ${userId} joined room`);
  }

  socket.on("shopStatusUpdate", async ({ barberId, status }) => {
    try {
      const barber = await Barber.findByIdAndUpdate(barberId, { shopStatus: status }, { new: true });
      if (barber) {
        io.emit("shopStatusUpdate", { barberId, status });
      }
    } catch (err) {
      console.error("Error updating shop status:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ A user disconnected:", socket.id);
  });
});


// Routes
const barberRoutes = require("./routes/barberRoutes")(io);
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

app.use("/barber", barberRoutes);
app.use("/admin", adminRoutes);
app.use("/auth", authRoutes);
app.use("/book", bookingRoutes);
app.use("/reviews", reviewRoutes);

// MongoDB Connection and Default Admin
mongoose.connect(process.env.MONGO_URI)
.then(async () => {
  console.log("✅ MongoDB Connected");
  await createDefaultAdmin();
}).catch(err => console.error("❌ MongoDB Connection Error:", err));

async function createDefaultAdmin() {
  try {
    const existingAdmin = await User.findOne({ role: "admin" });
    if (!existingAdmin) {
      const bcrypt = require("bcryptjs");
      const admin = new User({
        firstName: "Admin",
        lastName: "User",
        username: "admin",
        email: "admin@example.com",
        password: await bcrypt.hash("admin", 10),
        role: "admin"
      });
      await admin.save();
      console.log("✅ Default Admin Created (Username: admin, Password: admin)");
    } else {
      console.log("⚠️ Admin already exists.");
    }
  } catch (error) {
    console.error("❌ Error creating admin:", error);
  }
}

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
