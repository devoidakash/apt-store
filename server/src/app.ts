import express from "express";
import cors from "cors";
import errorHandler from "./middleware/error-handler";
import router from "./module/index-routes";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api", router);
app.use(errorHandler);

export default app;
