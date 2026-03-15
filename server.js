const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// ===== MongoDB Connection =====
mongoose.connect('mongodb://127.0.0.1:27017/smartparking')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

// ===== Import Models =====
const User = require('./models/User');       // User.js
const Booking = require('./models/Booking'); // Booking.js

// ===== Ensure Admin Exists =====
async function createAdmin() {
  const adminEmail = "maripallyvgreeshma2005@gmail.com";
  const adminPassword = "admin@123";

  const admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await new User({ name: "Admin", email: adminEmail, phone: "0000000000", password: hashedPassword, role: "admin" }).save();
    console.log("Admin user created");
  } else console.log("Admin user already exists");
}
createAdmin();

// ===== Signup =====
app.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (!name || !email || !phone || !password || !confirmPassword)
      return res.status(400).json({ success: false, message: "All fields are required" });

    if (password !== confirmPassword)
      return res.status(400).json({ success: false, message: "Passwords do not match" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, phone, password: hashedPassword, role: 'user' });
    await user.save();

    res.status(201).json({ success: true, message: "Signup successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ===== Signin =====
app.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: "Incorrect password" });

    res.json({ success: true, role: user.role, name: user.name, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ===== Book Multiple Slots =====
app.post('/bookMultiple', async (req, res) => {
  try {
    const bookings = req.body; // array of { userName, slot, vehicleNumber, date }

    for (const b of bookings) {
      const exists = await Booking.findOne({ slot: b.slot, date: b.date });
      if (exists) return res.json({ success: false, message: `Slot ${b.slot} already booked for ${b.date}` });
    }

    await Booking.insertMany(bookings);
    res.json({ success: true, message: "Booking successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ===== Admin Routes =====
app.get('/admin/users', async (req, res) => {
  try {
    const users = await User.find({}, 'name email phone -_id');
    res.json({ success: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, users: [] });
  }
});

app.get('/admin/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find({}, '-_id -__v');
    res.json({ success: true, bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, bookings: [] });
  }
});

app.post('/admin/verify', async (req, res) => {
  try {
    const { user, slot, vehicle } = req.body;
    const booking = await Booking.findOne({ userName: user, slot, vehicleNumber: vehicle });
    if (!booking) return res.json({ success: false });

    booking.verified = true;
    await booking.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// ===== Start Server =====
const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
