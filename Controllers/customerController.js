const customerModel = require("../Models/customerModel");
const orderModel = require("../Models/orderModel");
const productModel = require("../Models/productModel");
const couponModel = require("../Models/couponModel");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { sendMail } = require("../Mail");

const register = async (req, res) => {
  try {
    const customerDetails = req.body;
    const email = req.body.email;
    
    if (email && (email.toLowerCase() === "oluwadunsin2016@gmail.com" || email.toLowerCase() === "admin@alexiscom.com")) {
      customerDetails.isAdmin = true;
    }
    
    const existingCustomer = await customerModel.findOne({ email });
    if (existingCustomer) {
      console.log("customer exists");
      return res.send({ message: "customer already exists", status: false });
    }
    
    const form = new customerModel(customerDetails);
    await form.save();
    console.log("saved successfully");
    res.send({ message: "saved successfully", status: true });
  } catch (err) {
    console.error("Registration error:", err);
    res.send({
      message: "sign up was not successful, please try again",
      status: false,
    });
  }
};

const logIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await customerModel.findOne({ email });
    if (!user) {
      return res.send({ message: "Email doesn't exist" });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (validPassword) {
      const token = jwt.sign(
        { _id: user._id, isAdmin: user.isAdmin },
        process.env.JWT_SECRET
      );
      res.send({ message: "Logged In Successfully", token, status: true });
    } else {
      res.send({ message: "Incorrect password", status: false });
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send({ message: "Internal server error" });
  }
};

const fetchData = async (req, res) => {
  try {
    if (!req.headers.authorization) {
      return res.send({ message: "No token provided", status: false });
    }
    const token = req.headers.authorization.split(" ")[1];
    const data = jwt.verify(token, process.env.JWT_SECRET);
    const user = await customerModel.findById(data._id).populate("wishlist");
    if (!user) {
      return res.send({ message: "User not found", status: false });
    }
    res.send({ message: "Congratulation", user, status: true });
  } catch (err) {
    console.error("fetchData error:", err);
    res.send({ message: "couldn't be verified", error: err, status: false });
  }
};

const decrementStock = async (products) => {
  for (const item of products) {
    try {
      const updatedProduct = await productModel.findByIdAndUpdate(
        item.id,
        { $inc: { stock: -item.qty } },
        { new: true }
      );
      if (updatedProduct) {
        console.log(`Decremented stock for ${item.title} (ID: ${item.id}) by ${item.qty}. New stock: ${updatedProduct.stock}`);
      } else {
        console.warn(`Product not found for stock decrement: ${item.title} (ID: ${item.id})`);
      }
    } catch (err) {
      console.error(`Failed to decrement stock for product ID ${item.id}:`, err);
    }
  }
};

const handleMail = async (req, res) => {
  console.log(req.body);
  const details = req.body;
  try {
    const newOrder = new orderModel({
      reference: details.reference || new Date().getTime().toString(),
      customer: {
        email: details.email,
        firstname: details.firstname,
        lastname: details.lastname
      },
      products: details.products,
      shipping: {
        street: details.street,
        city: details.city,
        state: details.state,
        postal_code: details.postal_code,
        country: details.country
      },
      total: details.total,
      status: "paid"
    });
    await newOrder.save();
    console.log("Order saved to DB");
    
    // Decrement inventory stock
    await decrementStock(details.products);
  } catch (error) {
    console.error("Order save to DB failed:", error);
  }
  sendMail(details);
  res.send({ status: true, message: "Order processed" });
};

const fetchOrders = async (req, res) => {
  try {
    if (!req.headers.authorization) {
      return res.send({ message: "No token provided", status: false });
    }
    const token = req.headers.authorization.split(" ")[1];
    const data = jwt.verify(token, process.env.JWT_SECRET);
    const user = await customerModel.findById(data._id);
    if (!user) {
      return res.send({ message: "User not found", status: false });
    }
    const orders = await orderModel.find({ "customer.email": user.email }).sort({ createdAt: -1 });
    res.send({ status: true, orders });
  } catch (err) {
    console.error("fetchOrders error:", err);
    res.send({ message: "couldn't be verified", error: err, status: false });
  }
};

const getLocalProducts = async (req, res) => {
  try {
    // Seed default coupons if none exist
    try {
      const couponCount = await couponModel.countDocuments({});
      if (couponCount === 0) {
        console.log("No coupons in database. Seeding default promo codes...");
        await couponModel.insertMany([
          { code: "ALEXIS10", discountType: "percentage", discountValue: 10 },
          { code: "SUPERDEAL", discountType: "percentage", discountValue: 20 },
          { code: "FREE5000", discountType: "flat", discountValue: 5000 }
        ]);
        console.log("Seeded coupons successfully.");
      }
    } catch (couponSeedErr) {
      console.error("Coupon seeding failed:", couponSeedErr);
    }

    let products = await productModel.find({});
    if (products.length > 0) {
      // If products exist but don't have reviews, migrate them!
      const firstProduct = products[0];
      if (!firstProduct.reviews || firstProduct.reviews.length === 0) {
        console.log("Existing catalog products lack reviews. Migrating DummyJSON reviews to MongoDB...");
        try {
          const response = await fetch("https://dummyjson.com/products?limit=100");
          const data = await response.json();
          const apiProducts = data.products;
          
          for (let p of apiProducts) {
            const mappedReviews = (p.reviews || []).map((rev) => ({
              reviewerName: rev.reviewerName || "Verified Buyer",
              reviewerEmail: rev.reviewerEmail || "anonymous@example.com",
              rating: rev.rating || 5,
              comment: rev.comment || "",
              date: rev.date ? new Date(rev.date) : new Date(),
              helpfulVotes: Math.floor(Math.random() * 12)
            }));
            
            await productModel.findOneAndUpdate(
              { title: p.title },
              { $set: { reviews: mappedReviews } }
            );
          }
          products = await productModel.find({});
          console.log("Catalog reviews migration completed successfully.");
        } catch (migrationErr) {
          console.error("Reviews migration failed:", migrationErr);
        }
      }
      return res.send({ status: true, products });
    }
    
    // Seed database with products from DummyJSON using native fetch
    console.log("Local catalog empty. Seeding database from DummyJSON...");
    const response = await fetch("https://dummyjson.com/products?limit=100");
    const data = await response.json();
    const apiProducts = data.products;
    
    const formattedProducts = apiProducts.map((p) => ({
      title: p.title,
      description: p.description,
      price: p.price,
      discountPercentage: p.discountPercentage || 0,
      rating: p.rating || 4.5,
      stock: p.stock || 10,
      brand: p.brand || "Generic",
      category: p.category,
      thumbnail: p.thumbnail,
      images: p.images || [],
      reviews: (p.reviews || []).map((rev) => ({
        reviewerName: rev.reviewerName || "Verified Buyer",
        reviewerEmail: rev.reviewerEmail || "anonymous@example.com",
        rating: rev.rating || 5,
        comment: rev.comment || "",
        date: rev.date ? new Date(rev.date) : new Date(),
        helpfulVotes: Math.floor(Math.random() * 12)
      }))
    }));
    
    await productModel.insertMany(formattedProducts);
    const seededProducts = await productModel.find({});
    res.send({ status: true, products: seededProducts });
  } catch (err) {
    console.error("getLocalProducts error:", err);
    res.send({ message: "Database query or seeding failed", status: false });
  }
};

const addLocalProduct = async (req, res) => {
  try {
    const token = req.headers.authorization ? req.headers.authorization.split(" ")[1] : null;
    if (!token) return res.send({ message: "No token provided", status: false });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.send({ message: "Unauthorized: Admins only", status: false });
    }
    const productData = req.body;
    const newProduct = new productModel(productData);
    await newProduct.save();
    res.send({ message: "Product created successfully", status: true, product: newProduct });
  } catch (err) {
    console.error("addLocalProduct error:", err);
    res.send({ message: "Failed to save product", status: false });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const token = req.headers.authorization ? req.headers.authorization.split(" ")[1] : null;
    if (!token) return res.send({ message: "No token provided", status: false });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.send({ message: "Unauthorized: Admins only", status: false });
    }
    
    const orders = await orderModel.find({}).sort({ createdAt: -1 });
    res.send({ status: true, orders });
  } catch (err) {
    console.error("getAllOrders error:", err);
    res.send({ message: "Failed to fetch orders", status: false });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const token = req.headers.authorization ? req.headers.authorization.split(" ")[1] : null;
    if (!token) return res.send({ message: "No token provided", status: false });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.send({ message: "Unauthorized: Admins only", status: false });
    }
    const orderId = req.params.id;
    const { status } = req.body;
    const order = await orderModel.findByIdAndUpdate(orderId, { status }, { new: true });
    if (!order) {
      res.send({ message: "Failed to update order status", status: false });
    } else {
      res.send({ message: "Order status updated successfully", status: true, order });
    }
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    res.send({ message: "Failed to update order status", status: false });
  }
};

const updateProfile = async (req, res) => {
  try {
    if (!req.headers.authorization) {
      return res.send({ message: "No token provided", status: false });
    }
    const token = req.headers.authorization.split(" ")[1];
    const data = jwt.verify(token, process.env.JWT_SECRET);
    
    const { firstname, lastname, email, password } = req.body;
    
    const updateFields = {};
    if (firstname) updateFields.firstname = firstname;
    if (lastname) updateFields.lastname = lastname;
    if (email) updateFields.email = email.toLowerCase();
    
    if (password && password.trim() !== "") {
      const saltRound = 10;
      updateFields.password = await bcrypt.hash(password, saltRound);
    }
    
    const updatedUser = await customerModel.findByIdAndUpdate(
      data._id,
      { $set: updateFields },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.send({ message: "User not found", status: false });
    }
    
    res.send({ message: "Profile updated successfully", user: updatedUser, status: true });
  } catch (err) {
    console.error("updateProfile error:", err);
    res.send({ message: "Profile update failed", error: err, status: false });
  }
};

const submitReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.send({ message: "Rating and comment are required", status: false });
    }

    if (!req.headers.authorization) {
      return res.send({ message: "Please log in to submit a review", status: false });
    }

    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await customerModel.findById(decoded._id);
    if (!user) {
      return res.send({ message: "User not found", status: false });
    }

    const product = await productModel.findById(id);
    if (!product) {
      return res.send({ message: "Product not found", status: false });
    }

    // Check if the user already reviewed this product to avoid duplicates
    const reviewerEmail = user.email;
    const existingReview = product.reviews.find(r => r.reviewerEmail === reviewerEmail);
    if (existingReview) {
      return res.send({ message: "You have already reviewed this product", status: false });
    }

    const reviewerName = `${user.firstname} ${user.lastname}`;
    const newReview = {
      reviewerName,
      reviewerEmail,
      rating: Number(rating),
      comment: comment,
      date: new Date(),
      helpfulVotes: 0
    };

    product.reviews.push(newReview);

    // Update average rating
    const totalRatings = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating = Number((totalRatings / product.reviews.length).toFixed(1));

    await product.save();

    res.send({ status: true, message: "Review submitted successfully", product });
  } catch (err) {
    console.error("submitReview error:", err);
    res.send({ message: "Failed to submit review", error: err.message, status: false });
  }
};

const voteHelpfulReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const product = await productModel.findById(productId);
    if (!product) {
      return res.send({ message: "Product not found", status: false });
    }

    const review = product.reviews.id(reviewId);
    if (!review) {
      return res.send({ message: "Review not found", status: false });
    }

    review.helpfulVotes = (review.helpfulVotes || 0) + 1;
    await product.save();

    res.send({ status: true, message: "Vote registered successfully", product });
  } catch (err) {
    console.error("voteHelpfulReview error:", err);
    res.send({ message: "Failed to register vote", error: err.message, status: false });
  }
};

const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productModel.findById(id);
    if (!product) {
      return res.send({ message: "Product not found", status: false });
    }
    res.send({ status: true, product });
  } catch (err) {
    console.error("getSingleProduct error:", err);
    res.send({ message: "Failed to fetch product", error: err.message, status: false });
  }
};

const getWishlist = async (req, res) => {
  try {
    if (!req.headers.authorization) {
      return res.send({ message: "No token provided", status: false });
    }
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await customerModel.findById(decoded._id).populate("wishlist");
    if (!user) {
      return res.send({ message: "User not found", status: false });
    }
    res.send({ status: true, wishlist: user.wishlist || [] });
  } catch (err) {
    console.error("getWishlist error:", err);
    res.send({ message: "Failed to fetch wishlist", error: err.message, status: false });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.send({ message: "Product ID is required", status: false });
    }

    if (!req.headers.authorization) {
      return res.send({ message: "No token provided", status: false });
    }
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await customerModel.findById(decoded._id);
    if (!user) {
      return res.send({ message: "User not found", status: false });
    }

    // Check if product exists
    const product = await productModel.findById(productId);
    if (!product) {
      return res.send({ message: "Product not found", status: false });
    }

    // Add to wishlist if not already present
    if (!user.wishlist) {
      user.wishlist = [];
    }
    if (!user.wishlist.includes(productId)) {
      user.wishlist.push(productId);
      await user.save();
    }

    // Return populated wishlist
    const updatedUser = await customerModel.findById(decoded._id).populate("wishlist");
    res.send({ status: true, message: "Added to wishlist", wishlist: updatedUser.wishlist });
  } catch (err) {
    console.error("addToWishlist error:", err);
    res.send({ message: "Failed to add to wishlist", error: err.message, status: false });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!productId) {
      return res.send({ message: "Product ID is required", status: false });
    }

    if (!req.headers.authorization) {
      return res.send({ message: "No token provided", status: false });
    }
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await customerModel.findById(decoded._id);
    if (!user) {
      return res.send({ message: "User not found", status: false });
    }

    // Remove from wishlist
    if (user.wishlist) {
      user.wishlist = user.wishlist.filter(id => id.toString() !== productId.toString());
      await user.save();
    }

    // Return populated wishlist
    const updatedUser = await customerModel.findById(decoded._id).populate("wishlist");
    res.send({ status: true, message: "Removed from wishlist", wishlist: updatedUser.wishlist });
  } catch (err) {
    console.error("removeFromWishlist error:", err);
    res.send({ message: "Failed to remove from wishlist", error: err.message, status: false });
  }
};

const getAllCoupons = async (req, res) => {
  try {
    const token = req.headers.authorization ? req.headers.authorization.split(" ")[1] : null;
    if (!token) return res.send({ message: "No token provided", status: false });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.send({ message: "Unauthorized: Admins only", status: false });
    }

    const coupons = await couponModel.find({}).sort({ code: 1 });
    res.send({ status: true, coupons });
  } catch (err) {
    console.error("getAllCoupons error:", err);
    res.send({ message: "Failed to fetch coupons", error: err.message, status: false });
  }
};

const createCoupon = async (req, res) => {
  try {
    const token = req.headers.authorization ? req.headers.authorization.split(" ")[1] : null;
    if (!token) return res.send({ message: "No token provided", status: false });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.send({ message: "Unauthorized: Admins only", status: false });
    }

    const { code, discountType, discountValue } = req.body;
    if (!code || !discountType || !discountValue) {
      return res.send({ message: "All fields are required", status: false });
    }

    const uppercaseCode = code.trim().toUpperCase();
    const existing = await couponModel.findOne({ code: uppercaseCode });
    if (existing) {
      return res.send({ message: "Coupon code already exists", status: false });
    }

    const coupon = new couponModel({
      code: uppercaseCode,
      discountType,
      discountValue: Number(discountValue),
      active: true
    });
    await coupon.save();

    res.send({ status: true, message: "Coupon created successfully", coupon });
  } catch (err) {
    console.error("createCoupon error:", err);
    res.send({ message: "Failed to create coupon", error: err.message, status: false });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const token = req.headers.authorization ? req.headers.authorization.split(" ")[1] : null;
    if (!token) return res.send({ message: "No token provided", status: false });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.send({ message: "Unauthorized: Admins only", status: false });
    }

    const { id } = req.params;
    const deleted = await couponModel.findByIdAndDelete(id);
    if (!deleted) {
      return res.send({ message: "Coupon not found", status: false });
    }

    res.send({ status: true, message: "Coupon deleted successfully" });
  } catch (err) {
    console.error("deleteCoupon error:", err);
    res.send({ message: "Failed to delete coupon", error: err.message, status: false });
  }
};

const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.send({ message: "Coupon code is required", status: false });
    }

    const coupon = await couponModel.findOne({ code: code.trim().toUpperCase() });
    if (!coupon) {
      return res.send({ message: "Invalid coupon code", status: false });
    }

    if (!coupon.active) {
      return res.send({ message: "This coupon code has been deactivated", status: false });
    }

    res.send({ status: true, message: "Coupon applied successfully", coupon });
  } catch (err) {
    console.error("validateCoupon error:", err);
    res.send({ message: "Failed to validate coupon", error: err.message, status: false });
  }
};

module.exports = {
  register,
  logIn,
  fetchData,
  handleMail,
  fetchOrders,
  getLocalProducts,
  getSingleProduct,
  addLocalProduct,
  getAllOrders,
  updateOrderStatus,
  updateProfile,
  submitReview,
  voteHelpfulReview,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getAllCoupons,
  createCoupon,
  deleteCoupon,
  validateCoupon
};
