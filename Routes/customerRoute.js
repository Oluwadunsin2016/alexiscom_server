const { Router } = require("express");
const {
  register,
  logIn,
  fetchData,
  handleMail,
  fetchOrders,
  getLocalProducts,
  addLocalProduct,
  getAllOrders,
  updateOrderStatus,
  updateProfile,
  submitReview,
  voteHelpfulReview,
  getSingleProduct,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getAllCoupons,
  createCoupon,
  deleteCoupon,
  validateCoupon
} = require("../Controllers/customerController");
const router=Router()

router.post('/register',register)
router.post('/login',logIn)
router.get('/profile',fetchData)
router.put('/profile',updateProfile)
router.post('/sendMail',handleMail)
router.get('/orders',fetchOrders)

// Local product catalog routes
router.get('/products', getLocalProducts)
router.get('/products/:id', getSingleProduct)
router.post('/products', addLocalProduct)

// Reviews routes
router.post('/products/:id/reviews', submitReview)
router.put('/products/:productId/reviews/:reviewId/helpful', voteHelpfulReview)

// Wishlist routes
router.get('/wishlist', getWishlist)
router.post('/wishlist', addToWishlist)
router.delete('/wishlist/:productId', removeFromWishlist)

// Coupon routes
router.get('/admin/coupons', getAllCoupons)
router.post('/admin/coupons', createCoupon)
router.delete('/admin/coupons/:id', deleteCoupon)
router.post('/coupons/validate', validateCoupon)

// Admin order management routes
router.get('/admin/orders', getAllOrders)
router.put('/admin/orders/:id', updateOrderStatus)

// Paystack Webhook
const { handlePaystackWebhook } = require("../Controllers/webhookController");
router.post('/webhook/paystack', handlePaystackWebhook)

module.exports=router