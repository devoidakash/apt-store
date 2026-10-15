import express from "express";
import cors from "cors";
import errorHandle from "./src/midlleware/error-handler";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Hello from apt store!",
  });
});

app.use(errorHandle);

export default app;
