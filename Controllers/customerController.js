const customerModel = require("../Models/customerModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { sendMail } = require("../Mail");

const register = (req, res) => {
  const customerDetails = req.body;
  const form = customerModel(customerDetails);
  const email = req.body.email;
  customerModel.find({ email }, (err, result) => {
    if (err) {
      console.log("there is an error");
    } else {
      if (result.length > 0) {
        console.log("customer exists");
        res.send({ message: "customer already exists", status: false });
      } else {
        form.save((err) => {
          if (err) {
            console.log(err);
            res.send({
              message: "sign up was not successful, please try again",
              status: false,
            });
          } else {
            console.log("saved successfully");
            res.send({ message: "saved successfully", status: true });
          }
        });
      }
    }
  });
};

const logIn = (req, res) => {
  const { email, password } = req.body;
  customerModel.findOne({ email }, async (err, user) => {
    if (err) {
      res.status(500).send({ message: "Internal server error" });
    } else {
      if (!user) {
        res.send({ message: "Email doesn't exist" });
      } else {
        const validPassword = await bcrypt.compare(password, user.password);
        if (validPassword) {
          const token = jwt.sign({ _id: user._id }, "secret");
          res.send({ message: "Logged In Successfully", token, status: true });
        } else {
          res.send({ message: "Incorrect password", status: false });
        }
      }
    }
  });
};

const fetchData = (req, res) => {
console.log(req.headers);
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, "secret", (err, data) => {
    if (err) {
      res.send({ message: "couldn't be verified", error: err, status: false });
    } else {
      const _id = data._id;
      customerModel.findOne({ _id }, (err, user) => {
        if (err) {
          res.send({ message: "Network errors", status: false });
        } else {
          res.send({ message: "Congratulation", user, status: true });
        }
      });
    }
  });
};

const handleMail=(req,res)=>{
console.log(req.body);
const details=req.body
sendMail(details)
}

module.exports = { register, logIn, fetchData,handleMail };
