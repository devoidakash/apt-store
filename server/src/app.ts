import express from "express";
import cors from "cors";
import errorHandler from "./middleware/error-handler";
import router from "./module/index-routes";
import { handleDatabaseError } from "./middleware/db-error";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.use("/api", router);

app.use(handleDatabaseError);
app.use(errorHandler);

export default app;
