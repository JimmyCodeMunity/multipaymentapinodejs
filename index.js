const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");


const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// socket connection
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    // origin: ["http://localhost:3000", "http://localhost:3001","https://cbfe-41-139-202-31.ngrok-free.app"], // Add multiple origins here
    origin: "*",
    methods: ["GET", "POST"],
  },
});

//handle environment variables
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "./.env",
  });
}

//   env variables
const serverport = process.env.PORT;
const dbconnectionurl = process.env.DB_CONNECTION_URL;
// const auth_url = process.env.auth_url
// const consumer_key = process.env.consumer_key;
// const consumer_secret = process.env.consumer_secret;
// const callback_url = process.env.callback_url;
// const PESAPAL_DEMO_URL = process.env.PESAPAL_DEMO_URL;

// database connection
mongoose
  .connect(dbconnectionurl)
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch((error) => {
    console.log("db connection succeeded");
  });

server.listen(serverport, () => {
  console.log(`Server is running on port ${serverport}`);
});

app.get("/", (req, res) => {
  res.send("Hello Payments🙂");
});


const userSocketMap = {};
// const driverSocketMap = {}
// Track driver's location
io.on("connection", (socket) => {
  console.log("user connected successfully", socket.id);
  const userId = socket.handshake.query.userId;
  console.log("userid", userId);

  if (userId !== "undefined") {
    userSocketMap[userId] = socket.id;
  }
  console.log("user socket map", userSocketMap);
  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    delete userSocketMap[userId];
    console.log("user socket map after disconnect", userSocketMap);
  });


  socket.on("plan-paid", async (data) => {
    console.log("plan has been paid");
    console.log("user paying",data)
    const receiverId = userSocketMap[data.userId];
    const userId = data?.userId;
    const planId = data?.planId;
    if (!receiverId) {
      console.log("User not found");
      return;
    }
    // return
    
    await updatedUserPlan(userId,planId);
  });
})

//routes
const pesapalpaymentRouter = require("./routes/PesapalRoutes")(userSocketMap,io);
const stripepaymentRouter = require("./routes/StripeRoutes")(userSocketMap,io);
const sasapayRouter = require('./routes/SasapayRoutes')(userSocketMap,io);


const planRoutes = require("./routes/PlanRoutes");
const userRouter = require("./routes/UserRoutes");
const { updatedUserPlan } = require("./controllers/StripePaymentController");


app.use("/api/v1/payments/pesapal", pesapalpaymentRouter);
app.use("/api/v1/payments/stripe", stripepaymentRouter);
app.use("/api/v1/payments/sasapay",sasapayRouter);
app.use("/api/v1/plans", planRoutes);
app.use("/api/v1/user", userRouter);
