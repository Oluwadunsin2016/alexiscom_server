const mongoose = require("mongoose");
 
const couponSchema = mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  discountType: { type: String, required: true, enum: ["percentage", "flat"] },
  discountValue: { type: Number, required: true },
  active: { type: Boolean, default: true }
});
 
const couponModel = mongoose.model("Coupon", couponSchema);
 
module.exports = couponModel;
