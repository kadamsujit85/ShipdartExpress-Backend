const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Replace with your Easebuzz keys
const MERCHANT_KEY = "YOUR_MERCHANT_KEY";
const SALT = "YOUR_SALT";
const ENV = "test"; // or "prod"

app.post("/initiate-payment", (req, res) => {
  const { txnid, amount, firstname, email, phone, productinfo
    } = req.body;

  // Hash sequence: key|txnid|amount|productinfo|firstname|email|||||||||||salt
  const hashString = `${MERCHANT_KEY
    }|${txnid
    }|${amount
    }|${productinfo
    }|${firstname
    }|${email
    }|||||||||||${SALT
    }`;
  const hash = crypto.createHash("sha512").update(hashString).digest("hex");

  res.json({
    key: MERCHANT_KEY,
    txnid,
    amount,
    firstname,
    email,
    phone,
    productinfo,
    surl: "http://localhost:5000/payment-success",
    furl: "http://localhost:5000/payment-fail",
    hash,
    env: ENV,
    });
});

// Success / Fail Response
app.post("/payment-success", (req, res) => {
  console.log("Payment Success:", req.body);
  res.send("Payment successful");
});

app.post("/payment-fail", (req, res) => {
  console.log("Payment Failed:", req.body);
  res.send("Payment failed");
});

app.listen(5000, () => console.log("Server running on port 5000"));
