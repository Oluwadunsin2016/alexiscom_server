const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const customerSchema = mongoose.Schema({
  firstname: String,
  lastname: String,
  email: String,
  password: String,
});

const saltRound = 10;
customerSchema.pre("save", function (next) {
  bcrypt.hash(this.password, saltRound, (err, hashedPassword) => {
    if (err) {
      console.log(err);
    } else {
      this.password = hashedPassword;
      this.email = this.email.toLowerCase();
      next();
    }
  });
});

const customerModel = mongoose.model("customer", customerSchema);

module.exports = customerModel;
