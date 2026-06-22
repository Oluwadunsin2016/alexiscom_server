const nodemailer = require("nodemailer");

const sendMail = async (details) => {
  const convertedTotal = details.total * 440;
  const TotalPrice = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(convertedTotal);

  const getProducts = (product) => {
    const convertedPrice = product.totalPrice * 440;
    const price = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(convertedPrice);

    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; width: 48px;">
          <img src="${product.thumbnail}" height="48" width="48" style="border-radius: 8px; border: 1px solid #e2e8f0; object-fit: cover; display: block;" alt="product_image"/>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-family: system-ui, -apple-system, sans-serif; font-size: 13px; font-weight: 600; color: #1e293b; text-align: left;">
          ${product.title}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-family: system-ui, -apple-system, sans-serif; font-size: 13px; color: #64748b; text-align: center;">
          ${product.qty}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-family: system-ui, -apple-system, sans-serif; font-size: 13px; font-weight: bold; color: #1e293b; text-align: right;">
          &#8358;${price}
        </td>
      </tr>
    `;
  };

  let transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  let info = await transporter.sendMail({
    from: process.env.EMAIL,
    to: details.email,
    subject: "ALEXISCOM ONLINE SHOPPING — ORDER CONFIRMED",
    html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Order Confirmation</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      
      <!-- Gradient Header -->
      <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 36px 32px; text-align: center; position: relative;">
        <h1 style="color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: 3px; margin: 0; text-transform: uppercase;">
          ALEXISCOM
        </h1>
        <p style="color: rgba(255, 255, 255, 0.85); font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin: 6px 0 0 0;">
          Order Confirmation & Receipt
        </p>
      </div>

      <!-- Content Area -->
      <div style="padding: 32px 24px;">
        
        <!-- Greeting Panel -->
        <div style="background-color: #f1f5f9; border-left: 4px solid #4f46e5; border-radius: 8px; padding: 20px; margin-bottom: 28px;">
          <h2 style="font-size: 16px; font-weight: 700; color: #1e293b; margin: 0 0 8px 0; text-transform: capitalize;">
            Dear ${details.firstname} ${details.lastname},
          </h2>
          <p style="font-size: 13.5px; line-height: 22px; color: #475569; margin: 0;">
            Thank you for your order! Your purchase order <strong>${details.trans}</strong> has been successfully placed and confirmed. We will package and dispatch your items shortly.
          </p>
        </div>

        <p style="font-size: 13px; line-height: 20px; color: #475569; margin: 0 0 24px 0;">
          📦 Delivery times take a maximum of seven (7) days depending on the selected shipping pick-up terminal or door location.
        </p>

        <!-- Order items Table -->
        <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #4f46e5; margin: 0 0 12px 0;">
          Items Summary
        </h3>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
          <thead>
            <tr>
              <th style="padding: 10px 12px; text-align: left; background-color: #f8fafc; color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">Image</th>
              <th style="padding: 10px 12px; text-align: left; background-color: #f8fafc; color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">Item Description</th>
              <th style="padding: 10px 12px; text-align: center; background-color: #f8fafc; color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">Qty</th>
              <th style="padding: 10px 12px; text-align: right; background-color: #f8fafc; color: #64748b; font-size: 10px; font-weight: 800; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${details.products.map(getProducts).join("")}
            <tr style="background-color: #f8fafc;">
              <td colspan="3" style="padding: 16px 12px; text-align: left; font-size: 14px; font-weight: 800; color: #1e293b; border-top: 2px solid #e2e8f0;">
                Order Total
              </td>
              <td style="padding: 16px 12px; text-align: right; font-size: 15px; font-weight: 900; color: #4f46e5; border-top: 2px solid #e2e8f0;">
                &#8358;${TotalPrice}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Information Panels Grid (Email Client Safe) -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 12px;">
              <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; min-height: 90px; background-color: #f8fafc;">
                <h4 style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #4f46e5; margin: 0 0 8px 0;">
                  Recipient Details
                </h4>
                <p style="font-size: 12.5px; line-height: 18px; color: #1e293b; margin: 0; font-weight: 600;">
                  ${details.firstname} ${details.lastname}
                </p>
                <p style="font-size: 11.5px; color: #64748b; margin: 4px 0 0 0; word-break: break-all;">
                  ${details.email}
                </p>
              </div>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 12px;">
              <div style="border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; min-height: 90px; background-color: #f8fafc;">
                <h4 style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #4f46e5; margin: 0 0 8px 0;">
                  Shipping Address
                </h4>
                <p style="font-size: 12px; line-height: 18px; color: #334155; margin: 0;">
                  ${details.street}<br />
                  ${details.city}, ${details.state} State
                </p>
              </div>
            </td>
          </tr>
        </table>

        <!-- Footer / Contact Divider -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 28px; text-align: center;">
          <p style="font-size: 12px; color: #64748b; margin: 0 0 16px 0;">
            Thank you for shopping on <strong>AlexisCom</strong>. Your convenience is our priority.
          </p>
          
          <p style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin: 0 0 12px 0;">
            Need help? Contact us:
          </p>

          <!-- Social Icons List -->
          <div style="margin: 0 auto; text-align: center;">
            <a href="https://www.facebook.com/sunday.stephen.3990" style="display: inline-block; margin: 0 6px; text-decoration: none;">
              <img height="22" width="22" src="https://cdn-icons-png.flaticon.com/512/733/733547.png" style="display: block;" alt="facebook"/>
            </a>
            <a href="https://wa.me/2348168225901" style="display: inline-block; margin: 0 6px; text-decoration: none;">
              <img height="22" width="22" src="https://cdn-icons-png.flaticon.com/512/733/733585.png" style="display: block;" alt="whatsapp"/>
            </a>
            <a href="https://www.linkedin.com/in/oluwagbemiga-sunday-stephen-635a85270/" style="display: inline-block; margin: 0 6px; text-decoration: none;">
              <img height="22" width="22" src="https://cdn-icons-png.flaticon.com/512/3536/3536505.png" style="display: block;" alt="linkedin"/>
            </a>
            <a href="https://twitter.com/Stephen93639861" style="display: inline-block; margin: 0 6px; text-decoration: none;">
              <img height="22" width="22" src="https://cdn-icons-png.flaticon.com/512/733/733579.png" style="display: block;" alt="twitter"/>
            </a>
            <a href="tel:+2348168225901" style="display: inline-block; margin: 0 6px; text-decoration: none;">
              <img height="22" width="22" src="https://cdn-icons-png.flaticon.com/512/597/597177.png" style="display: block;" alt="call"/>
            </a>
          </div>
        </div>

      </div>
    </div>
  </body>
</html>
`,
  });

  console.log(info);
};

module.exports = { sendMail };
