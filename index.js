const express = require("express");
const stripe = require("stripe")(
    "sk_test_51L2vNMJH0mXagrhOnlmlSRuGcZlxlPmTDXwppJRC9qpPBLt5yfnn89Q8cbmvDv9ftU2R5ejHxMqM7stzUlZXbRfP00qrbjPmoS"
);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

// MIDDLEWARE
app.use(express.json());
const corsConfig = {
    origin: ["http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
};
app.use(cors(corsConfig));
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.USER_ID}:${process.env.USER_PASSWORD}@finder.nudv56z.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    console.log(token);
    if (!token) {
        res.status(401).send({ message: "unauthorized access" });
    }
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "unauthorized access" });
        }
        req.user = decoded;
        next();
    });
};

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

const carsDatabase = client.db("finderDB").collection("cars");
const cartDatabase = client.db("finderDB").collection("cart");

// JWT
app.post("/jwt", async (req, res) => {
    const user = req.body;
    console.log(user);
    const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: "1h" });
    console.log(token);
    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
    }).send({ success: true });
});
app.post("/log-out", async (req, res) => {
    res.clearCookie("token", { maxAge: 0 }).send({ success: true });
});

app.get("/cars", async (req, res) => {
    const result = await carsDatabase.find().toArray();
    res.send(result);
});
app.get("/cart", verifyToken, async (req, res) => {
    console.log(req.query);
    console.log(req.user);
    const result = await cartDatabase.find().toArray();
    res.send(result);
});
app.get("/product/:brand", async (req, res) => {
    const brand = req.params;
    const result = await carsDatabase
        .find({ brand: { $all: [brand.brand] } })
        .toArray();
    res.send(result);
});
app.get("/product/:brand/:id", async (req, res) => {
    const brand = req.params;
    const result = await carsDatabase
        .find({ _id: new ObjectId(brand.id) })
        .toArray();
    res.send(result);
});
app.put("/product/:brand/:id", async (req, res) => {
    const brand = req.params;
    const car = req.body;
    console.log(car);
    console.log(brand);
    const query = { _id: new ObjectId(brand.id) };
    const updatedCar = {
        $set: {
            photoUrl: car.photoUrl,
            name: car.name,
            brand: car.brand,
            type: car.type,
            price: car.price,
            description: car.description,
            rating: car.rating,
        },
    };
    const result = await carsDatabase.updateOne(query, updatedCar);
    res.send(result);
});
app.post("/cars", async (req, res) => {
    const car = req.body;
    const result = await carsDatabase.insertOne(car);
    res.send(result);
});
app.post("/cart", async (req, res) => {
    const cart = req.body;
    const result = await cartDatabase.insertOne(cart);
    res.send(result);
});
app.delete("/cart/:id", async (req, res) => {
    const id = req.params;
    const result = await cartDatabase.deleteOne({
        _id: new ObjectId(id),
    });
    res.send(result);
});
app.delete("/product/:id", async (req, res) => {
    const id = req.params;
    const result = await carsDatabase.deleteOne({
        _id: new ObjectId(id),
    });
    res.send(result);
});

// payment
app.post("/create-payment-intent", async (req, res) => {
    const { price } = req.body;
    console.log(price);
    const amount = parseInt(price * 100);
    const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
    });
    res.send({
        clientSecret: paymentIntent.client_secret,
    });
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/index.html"));
});

app.listen(port, () => {
    console.log("Server started at http://localhost:" + port);
});
//
