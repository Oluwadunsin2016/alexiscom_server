const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
  reference: { type: String, required: true, unique: true },
  customer: {
    email: { type: String, required: true },
    firstname: String,
    lastname: String
  },
  products: [{
    id: String,
    title: String,
    qty: Number,
    price: Number,
    totalPrice: Number,
    thumbnail: String
  }],
  shipping: {
    street: String,
    city: String,
    state: String,
    postal_code: String,
    country: String
  },
  total: { type: Number, required: true },
  status: { type: String, default: "pending" }, // pending, paid, shipped, delivered
  createdAt: { type: Date, default: Date.now }
});

const orderModel = mongoose.model("Order", orderSchema);

module.exports = orderModel;
