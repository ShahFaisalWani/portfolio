const express = require("express");
const axios = require("axios");
const UAParser = require("ua-parser-js");
const moment = require("moment-timezone");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
require("dotenv").config();

const verifyToken = require("./middleware/auth");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const mongoose = require("mongoose");
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected..."))
  .catch((err) => console.log("MongoDB connection error:", err));

const trafficSchema = new mongoose.Schema({
  path: String,
  method: String,
  ip: String,
  city: String,
  region: String,
  country: String,
  device: String,
  timestamp: String,
});
const Traffic = mongoose.model("Traffic", trafficSchema);

const tracker = (req, res, next) => {
  const clientIp =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;

  const userAgent = req.headers["user-agent"];

  const parser = new UAParser();
  const deviceDetails = parser.setUA(userAgent).getResult();

  if (clientIp) {
    axios
      .get(`https://ipinfo.io/${clientIp}?token=${process.env.IPINFO_APIKEY}`)
      .then((response) => {
        const locationData = response.data;

        const bangkokTime = moment
          .tz("Asia/Bangkok")
          .format("YYYY-MM-DD HH:mm:ss")
          .toString();

        const newTraffic = new Traffic({
          path: req.url,
          method: req.method,
          ip: clientIp,
          city: locationData.city,
          region: locationData.region,
          country: locationData.country,
          device: `${deviceDetails.browser.name} on ${deviceDetails.os.name} (${
            deviceDetails.device.type || "Desktop"
          })`,
          timestamp: bangkokTime,
        });

        newTraffic
          .save()
          .then(() =>
            console.log("Traffic data saved with device info at " + bangkokTime)
          )
          .catch((err) => console.error("Error saving traffic data", err));
      })
      .catch((err) => console.error("Error fetching location data:", err));
  }

  next();
};

app.get("/", tracker, (req, res) => {
  res.send("Traffic Monitoring Backend");
});

const user = {
  username: "admin",
  password: bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10),
};

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  console.log("login", username, password);

  if (username !== user.username) {
    return res.status(400).json({ error: "Invalid username" });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ error: "Invalid password" });
  }

  const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.json({ token });
});

app.get("/api/traffic", verifyToken, async (req, res) => {
  try {
    const trafficData = await Traffic.find().sort({ timestamp: -1 });
    res.json(trafficData);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch traffic data" });
  }
});

const PORT = process.env.PORT || 8888;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
