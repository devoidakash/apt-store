import "dotenv/config";
import { error } from "node:console";
import app from "./app";

if (!process.env.PORT) {
  throw error("PORT missing form .env");
}

app.listen(process.env.PORT, () => {
  console.log(`server started at: http://localhost:${process.env.PORT}`);
});
