//Required imports

const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const { payment_success_rate_gauge, no_of_payments_counter } = require('./customMetrics');

const Razorpay = require('razorpay');
const crypto = require('crypto');

const cors = require('cors');

var payment_count = 0;
var successful_payment_count = 0;
var success_rate = 0;


//Initialization

router.use(cors({
    origin : ["http://nginx:80"],
    methods : ["GET", "POST", "PUT", "DELETE"],
    credentials : true
}));

router.use(cookieParser());

router.use(bodyParser.urlencoded({extended : true}));

router.use(
    session({
        key : "userId",
        secret : "subscribe",
        resave : false,
        saveUninitialized : false,
        cookie : {
            expires : 	10800000 // 3 hrs expiry of cookie in browser
        }, 
    })
);

router.options("*", cors());

const razorpay = new Razorpay({
    key_id: 'rzp_test_tlLFJ93Dvp72rB',
    key_secret: '0ifinc1eBoyDvgWRgD2y5Sg1',
});

//routes



router.post("/create-orders", async (req, res)=> {
    const { amount, currency } = req.body;

    const options = {
        amount,
        currency,
        receipt: 'order_receipt',
        payment_capture: '1',    
    };

    try {

        const response = await razorpay.orders.create(options);
        res.json(response);

    }
    catch (error) {
        console.error(error);
        if (error.response && error.response.data) {
            console.error('Razorpay Response:', error.response.data);
        }

        res.status(500).json({ error: 'Internal NPCIServer Error' });
    }

});
    

router.post("/success-verification", (req, res)=> {
    try {
        no_of_payments_counter.inc();
        
        // getting the details back from our font-end
        const {
            orderCreationId,
            razorpayPaymentId,
            razorpayOrderId,
            razorpaySignature,
        } = req.body;


        // digest = hmac_sha256(orderCreationId + "|" + razorpayPaymentId, secret);
        const shasum = crypto.createHmac("sha256", "0ifinc1eBoyDvgWRgD2y5Sg1");
        shasum.update(`${orderCreationId}|${razorpayPaymentId}`);

        const digest = shasum.digest("hex");

        payment_count = payment_count + 1;
        
        // comaparing our digest with the actual signature
        if (digest !== razorpaySignature){
            success_rate = successful_payment_count/payment_count;
            payment_success_rate_gauge.set(success_rate);
            return res.status(400).json({ msg: "Transaction not legit!" });
        }
        else{
            successful_payment_count = successful_payment_count + 1;
            success_rate = successful_payment_count/payment_count;
            payment_success_rate_gauge.set(success_rate);

            res.json({
                msg: "success",
                orderId: razorpayOrderId,
                paymentId: razorpayPaymentId,
            });
        }
        
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;