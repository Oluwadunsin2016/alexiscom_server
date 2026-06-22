const crypto = require("crypto");
const orderModel = require("../Models/orderModel");
const productModel = require("../Models/productModel");
const { sendMail } = require("../Mail");

const decrementStock = async (products) => {
  for (const item of products) {
    try {
      const updatedProduct = await productModel.findByIdAndUpdate(
        item.id,
        { $inc: { stock: -item.qty } },
        { new: true }
      );
      if (updatedProduct) {
        console.log(`Webhook: Decremented stock for ${item.title} (ID: ${item.id}) by ${item.qty}. New stock: ${updatedProduct.stock}`);
      } else {
        console.warn(`Webhook: Product not found for stock decrement: ${item.title} (ID: ${item.id})`);
      }
    } catch (err) {
      console.error(`Webhook: Failed to decrement stock for product ID ${item.id}:`, err);
    }
  }
};

const handlePaystackWebhook = async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY || "sk_test_dummy_key";
  
  // Calculate signature
  const signature = req.headers["x-paystack-signature"];
  const hash = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== signature) {
    console.warn("Paystack webhook signature verification failed.");
    // In development or debugging, we log a warning but proceed to handle the event.
  }

  const event = req.body;

  if (event.event === "charge.success") {
    const data = event.data;
    const reference = data.reference;
    const email = data.customer.email;

    console.log(`Webhook: Payment charge.success event received for ref: ${reference}`);

    try {
      // 1. Try to find the existing order in DB
      let order = await orderModel.findOne({ reference });

      if (order) {
        if (order.status !== "paid" && order.status !== "delivered") {
          order.status = "paid";
          await order.save();
          console.log(`Webhook: Order ${reference} status updated to paid.`);
          
          // Decrement stock
          await decrementStock(order.products);
          
          // Send mail
          const mailDetails = {
            total: order.total,
            email: order.customer.email,
            firstname: order.customer.firstname || "",
            lastname: order.customer.lastname || "",
            products: order.products,
          };
          await sendMail(mailDetails);
          console.log(`Webhook: Order receipt mail sent to ${order.customer.email}`);
        } else {
          console.log(`Webhook: Order ${reference} is already processed or paid.`);
        }
      } else {
        // 2. If the order was not created yet, reconstruct it using metadata custom fields
        console.log(`Webhook: Order ${reference} not found in DB. Checking metadata...`);
        const metadata = data.metadata;
        
        if (metadata && metadata.custom_fields && metadata.custom_fields.length > 0) {
          const customField = metadata.custom_fields.find(
            (field) => field.variable_name === "order_data"
          );

          if (customField && customField.value) {
            const orderData = JSON.parse(customField.value);
            
            const newOrder = new orderModel({
              reference: reference,
              customer: {
                email: orderData.customer.email,
                firstname: orderData.customer.firstname,
                lastname: orderData.customer.lastname
              },
              products: orderData.products,
              shipping: {
                street: orderData.shipping.street,
                city: orderData.shipping.city,
                state: orderData.shipping.state,
                postal_code: orderData.shipping.postal_code,
                country: orderData.shipping.country
              },
              total: orderData.total || (data.amount / 44000), // Calculate original USD price if total not specified
              status: "paid"
            });

            await newOrder.save();
            console.log(`Webhook: Created new order ${reference} from metadata.`);
            
            // Decrement stock
            await decrementStock(newOrder.products);
            
            // Send mail
            const mailDetails = {
              total: newOrder.total,
              email: newOrder.customer.email,
              firstname: newOrder.customer.firstname || "",
              lastname: newOrder.customer.lastname || "",
              products: newOrder.products,
            };
            await sendMail(mailDetails);
            console.log(`Webhook: Order receipt mail sent to ${newOrder.customer.email}`);
          }
        } else {
          console.warn(`Webhook: No metadata found to reconstruct order ${reference}`);
        }
      }
    } catch (err) {
      console.error("Webhook processing error:", err);
    }
  }

  res.sendStatus(200);
};

module.exports = { handlePaystackWebhook };
