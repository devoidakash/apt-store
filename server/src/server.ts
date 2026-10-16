import "dotenv/config";
import app from "./app";

switch (true) {
  case !process.env.PORT:
    throw new Error("PORT missing from .env");

  case !process.env.DATABASE_URL:
    throw new Error("DATABASE_URL missing from .env");

  default:
    console.log("Environment variables are configured");
}

app.listen(process.env.PORT, () => {
  console.log(`server started at: http://localhost:${process.env.PORT}`);
});
