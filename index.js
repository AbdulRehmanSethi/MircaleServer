const {
  globalErrorHandler,
  urlNotFoundHandler,
} = require("./Middlewares/GlobalErrorHandlers");
require("./dbConnection");
const express = require("express");
const fileUpload = require("express-fileupload"); // Add this line
const app = express();
const http = require("http");
const path = require("path");
const userRouter = require("./routes/userRouter");
const ytRouter = require("./routes/ytVideoRouter");
const PDFrouter = require("./routes/pdfRouter");
const shortsRouter = require("./routes/shortsRouter");
const cleanupScheduler = require("./utils/cleanupScheduler");
const imageRouter = require("./routes/imageRouter");
const ngrok = require("@ngrok/ngrok"); // Add ngrok
const webHookRouter = require("./routes/stripe/webhookRouter");
const checkoutRouter = require("./routes/stripe/checkoutRouter");
const adminRouter = require("./routes/adminRouter");

const port = process.env.PORT || 8080;
const server = http.createServer(app);
app.use("/youai/webhook", webHookRouter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/youai/images", imageRouter);
app.get("/", async (req, res) => {
  try {
    res.send("Welcome to YouAI API");
  } catch (error) {
    console.log(error.message);
  }
});
app.get("/success", (req, res) => {
  try {
    res.sendFile(path.join(__dirname, "./html/success.html"));
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
});
app.get("/canceled", (req, res) => {
  try {
    res.sendFile(path.join(__dirname, "./html/canceled.html"));
  } catch (error) {
    console.log(error.message);
    res.status(500).send("Internal Server Error");
  }
});
cleanupScheduler.start(10);
app.use(fileUpload());
app.use("/youai/public", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/config", express.static(path.join(__dirname, "config")));

app.use("/youai/users", userRouter);
app.use("/youai/yt", ytRouter);
app.use("/youai/PDF", PDFrouter);
app.use("/youai/shorts", shortsRouter);
app.use("/youai/admin", adminRouter);

app.use("/youai/stripe", checkoutRouter);

//* Error Handlers
app.use(urlNotFoundHandler);
app.use(globalErrorHandler);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);

  //   if (process.env.NODE_ENV === "development") {
  //     ngrok
  //       .connect({
  //         addr: port,
  //         authtoken: process.env.NGROK_AUTHTOKEN,
  //         // domain: "delicate-squid-legally.ngrok-free.app", // Use your custom domain
  //       })
  //       .then((listener) => {
  //         const url = listener.url();
  //         console.log(`Ingress established at: ${url}`);
  //       })
  //       .catch((err) => {
  //         console.error("Error connecting to ngrok:", err);
  //       });
  //   }
});
