const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// middleware
app.use(cors());
app.use(express.json());

// ---------------- CONNECT MONGODB ----------------
mongoose.connect("mongodb://127.0.0.1:27017/stationeryDB")
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// ---------------- ORDER SCHEMA ----------------
const orderSchema = new mongoose.Schema({
  name: String,
  phone: String,
  address: String,
  payment_method: String,
  items: Array,
  total: Number,
  invoice: String,
  date: Date,
  userId:String   // ⭐ ADDED FIELD ONLY
});

const Order = mongoose.model("Order", orderSchema);

// ---------------- CONTACT SCHEMA ----------------
const contactSchema = new mongoose.Schema({
  name: String,
  phone: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model("Contact", contactSchema);

// ---------------- ORDERS LIST SCHEMA ----------------
const ordersListSchema = new mongoose.Schema({
  invoice: String,
  items: Array,
  date: { type: Date, default: Date.now }
});

const OrdersList = mongoose.model("OrdersList", ordersListSchema);

// ---------------- TEST ROUTE ----------------
app.get("/", (req, res) => {
  res.send("Server Running Successfully");
});

// ---------------- PLACE ORDER ----------------
app.post("/order", async (req, res) => {
  try {
    const invoice = "INV" + Math.floor(Math.random() * 1000000);

    const newOrder = new Order({
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address,
      payment_method: req.body.payment_method,
      items: req.body.items,
      total: req.body.total,
      invoice: invoice,
      date: new Date(),
      userId:req.body.userId   // ⭐ ADDED ONLY
    });

    await newOrder.save();

    const newOrdersList = new OrdersList({
      invoice: invoice,
      items: req.body.items.map(item => ({
        product: item.name,
        qty: item.qty
      }))
    });

    await newOrdersList.save();

    res.json({
      message: "Order saved",
      invoice: invoice,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------- GET ALL ORDERS ----------------
app.get("/orders", async (req, res) => {
  const data = await Order.find().sort({ date: -1 });
  res.json(data);
});

// ---------------- GET ORDERS LIST ----------------
app.get("/orders-list", async (req, res) => {
  try {
    const data = await OrdersList.find().sort({ date: -1 });

    const formatted = data.flatMap(order =>
      order.items.map(item => ({
        invoice: order.invoice,
        product: item.product,
        quantity: item.qty
      }))
    );

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

// ---------------- POST CONTACT MESSAGE ----------------
app.post("/contact", async (req, res) => {
  try {
    const { name, phone, message } = req.body;

    if (!name || !phone || !message) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const newMessage = new Contact({ name, phone, message });
    await newMessage.save();

    res.status(200).json({ msg: "Message saved successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

// GET profile
app.get('/profile', (req, res) => {
    res.json({
        name: "Dandika Joshna",
        email: "dandika@example.com",
        phone: "1234567890"
    });
});

// GET orders
app.get('/orders', async (req, res) => {
    const orders = await Order.find({ userId: "123" });
    res.json(orders);
});


// ================== ⭐ ADDED ROUTES ONLY ==================

// get orders of logged user by userId
app.get("/my-orders/:id", async (req,res)=>{
    const orders = await Order.find({ userId:req.params.id }).sort({date:-1});
    res.json(orders);
});

// get orders by name (case-insensitive) — fallback for orders placed without userId
app.get("/my-orders-by-name/:name", async (req,res)=>{
    try {
        const nameRegex = new RegExp("^" + req.params.name.trim() + "$", "i");
        const orders = await Order.find({ name: nameRegex }).sort({date:-1});
        res.json(orders);
    } catch(err) {
        res.status(500).json({ msg: "Server error" });
    }
});

// ==========================================================


// ---------------- START SERVER ----------------
app.listen(5000, () => {
  console.log("Server started on port 5000");
});