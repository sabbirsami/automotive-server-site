const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

// MIDDLEWARE
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.USER_ID}:${process.env.USER_PASSWORD}@finder.nudv56z.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const carsDatabase = client.db("finderDB").collection("cars");
        const cartDatabase = client.db("finderDB").collection("cart");

        app.get("/cars", async (req, res) => {
            const result = await carsDatabase.find().toArray();
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
            console.log(brand);
            console.log(brand.brand);
            const result = await carsDatabase
                .find({ _id: new ObjectId(brand.id) })
                .toArray();
            console.log(result);
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

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "/index.html"));
});

app.listen(port, () => {
    console.log("Server started at http://localhost:" + port);
});
