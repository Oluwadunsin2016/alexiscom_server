const nodemailer = require("nodemailer");
const sendMail = async (details) => {

let TotalPrice = ''

 
    const converted = JSON.stringify(details.total * 440);
    if (converted.length > 12) {
      const num = converted.length - 12;
      const thouEnd = converted.slice(-3);
      const mil = converted.slice(7, -3);
      const bil = converted.slice(4, -6);
      const tril = converted.slice(1, -9);
      TotalPrice = `${converted.slice(0, num)},${tril},${bil},${mil},${thouEnd}.00`;
    } else if (converted.length > 9) {
      const num = converted.length - 9;
      const thouEnd = converted.slice(-3);
      const mil = converted.slice(5, -3);
      const bil = converted.slice(2, -6);
      TotalPrice = `${converted.slice(0, num)},${bil},${mil},${thouEnd}.00`;
    } else if (converted.length > 6) {
      const num = converted.length - 6;
      const thouEnd = converted.slice(-3);
      const mil = converted.slice(1, 4);
      TotalPrice = `${converted.slice(0, num)},${mil},${thouEnd}.00`;
    } else if (converted.length > 3) {
      const num = converted.length - 3;
      const thouEnd = converted.slice(-3);
      TotalPrice = `${converted.slice(0, num)},${thouEnd}.00`;
    } else {
      TotalPrice = `${converted}.00`;
    }

const getProducts=product=>{
let price=''
    const converted = JSON.stringify(product.totalPrice * 440);
       if (converted.length > 9) {
      const num = converted.length - 9;
      const thouEnd = converted.slice(-3);
      const mil = converted.slice(5, -3);
      const bil = converted.slice(2, -6);
      price = `${converted.slice(0, num)},${bil},${mil},${thouEnd}.00`;
    }else if (converted.length > 6) {
      const num = converted.length - 6;
      const thouEnd = converted.slice(-3);
      const mil = converted.slice(1, 4);
      price = `${converted.slice(0, num)},${mil},${thouEnd}.00`;
    } else if(converted.length > 3) {
      const num = converted.length - 3;
      const thouEnd = converted.slice(-3);
      price = `${converted.slice(0, num)},${thouEnd}.00`;
    }else{
    price = `${converted}.00`;
    }


         return (
        `<tr>
            <td>
              <img src=${product.thumbnail} height="60" width="60" alt="product_image"/>
            </td>
            <td>${product.title}</td>
            <td>${product.qty}</td>
            <td>&#8358;${price}</td>
          </tr>`
         )
}

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
    subject: "ALEXISCOM ONLINE SHOPPING",
    // text: "Hello world? text", // plain text body
    html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: Verdana, Geneva, Tahoma, sans-serif;
      }

       .logo {
       padding: 30px 0;
        color: rgb(209, 128, 35);
        text-shadow: 0 0 white;
        letter-spacing: 3px;
        font-size: 45px;
        text-align: center;
        font-family: fantasy;
        background-color: rgb(60, 60, 117);
      }


      .container {
        padding: 1rem 5rem;
      }

      table {
        border: 1px solid rgb(145, 142, 142);
        width: 70%;
        text-align: center;
      }

      td,
      th {
        border-bottom: 1px solid rgb(145, 142, 142);
      }

      th {
        color: rgb(73, 73, 73);
      }

      p {
        margin: 10px 0;
      }

      .ordered {
        margin-top: 30px;
        margin-bottom: 10px;
      }
      .details,
      .address {
        margin-top: 30px;
      }

      ul {
        list-style-type: none;
        display: flex;
        gap: 25px;
      }
      li {
        margin: 0 15px;
      }

      .contact{
      margin-bottom: 10px;
      }

    a{
    text-decoration: none;
    }

      @media screen and (max-width: 800px) {
        table {
          width: 100%;
        }

        .container {
          padding: 1rem 2rem;
        }
      }
    </style>
  </head>
  <body>
     <h1 class="logo">ALEXISCOM<img
          width="50"
          height="40"
          class="cart"
          src="https://res.cloudinary.com/dz8elpgwn/image/upload/v1670928578/1670926908717_lhs76n.png"
          alt=""
        /></h1>
    <div class="container">
      <p>
        Dear ${details.firstname} ${details.lastname},
        <br />
        We really appreciate your patronage.
      </p>
      <p>
        Your order <b>${details.trans}</b> has been successfully placed and confirmed
      </p>
      <p>
        It will be packaged and shipped as soon as possible. You will receive a
        notification from us once the item(s) are available for door delivery or
        collection from your selected pick-up station.
      </p>
      <p>
        It takes maximum of seven(7) days before the arrival of your product(s)
      </p>

      <h4 class="ordered">You ordered for:</h4>
      <table>
        <thead>
          <tr>
            <th>Picture</th>
            <th>Item</th>
            <th>Quantity</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
        ${details.products.map(getProducts)}
          <tr>
            <td colspan="3"><b>Total</b></td>
            <td><b>&#8358;${TotalPrice}</b></td>
          </tr>
        </tbody>
      </table>

      <h4 class="details">Recipient Details</h4>
      <span>${details.firstname} ${details.lastname}</span><br />
      <span>${details.email}</span>

      <h4 class="address">Delivery Address</h4>
      <span>${details.street}, ${details.city}</span><br />
      <span>${details.state} state</span>

      <p>
        Thanks for shopping on <b>AlexisCom Online Shopping PlatForm</b>, your
        convenience is our priority.
      </p>
      <p class="contact">For more enquiries, <b>contact us on</b></p>
     <ul>
        <li>
          <a
            href="https://www.facebook.com/sunday.stephen.3990"
            ><img
              height="20"
              width="20"
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Facebook_Logo_%282019%29.png/600px-Facebook_Logo_%282019%29.png"
              alt="facebook"
          /></a>
        </li>
        <li>
          <a href="https://wa.me/2348168225901"
            ><img
              height="20"
              width="20"
              src="https://w7.pngwing.com/pngs/922/489/png-transparent-whatsapp-icon-logo-whatsapp-logo-whatsapp-logo-text-trademark-grass-thumbnail.png"
              alt="whatsapp"
          /></a>
        </li>
        <li>
          <a href="http://www.linkedin.com/in/oluwagbemiga-stephen-oluwadunsin-2ba681227"
            ><img
              height="20"
              width="20"
              src="https://cdn-icons-png.flaticon.com/512/174/174857.png"
              alt="linkedin"
          /></a>
        </li>
        <li>
          <a href="https://twitter.com/Stephen93639861"
            ><img
              height="20"
              width="20"
              src="https://www.pngkey.com/png/full/2-27646_twitter-logo-png-transparent-background-logo-twitter-png.png"
              alt="twitter"
          /></a>
        </li>
        <li>
          <a href="tel:+2348168225901"
            ><img
              height="20"
              width="20"
              src="https://w7.pngwing.com/pngs/759/922/png-transparent-telephone-logo-iphone-telephone-call-smartphone-phone-electronics-text-trademark-thumbnail.png"
              alt="call"
          /></a>
        </li>
      </ul>
    </div>
  </body>
</html>
`, // html body
  });

  console.log(info);
};

module.exports = { sendMail };
