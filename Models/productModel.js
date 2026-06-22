const mongoose = require("mongoose");

const reviewSchema = mongoose.Schema({
  reviewerName: { type: String, required: true },
  reviewerEmail: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  date: { type: Date, default: Date.now },
  helpfulVotes: { type: Number, default: 0 }
});

const productSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  discountPercentage: { type: Number, default: 0 },
  rating: { type: Number, default: 4.5 },
  stock: { type: Number, required: true, default: 10 },
  brand: { type: String, required: true },
  category: { type: String, required: true },
  thumbnail: { type: String, required: true },
  images: [{ type: String }],
  reviews: { type: [reviewSchema], default: [] }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const productModel = mongoose.model("Product", productSchema);

module.exports = productModel;
