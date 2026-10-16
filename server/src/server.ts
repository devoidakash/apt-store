import env from "./config/env";
import app from "./app";

console.log("Environment variables are configured");

app.listen(env.port, () => {
  console.log(`server started at: http://localhost:${env.port}`);
});
