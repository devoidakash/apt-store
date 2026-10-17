import { Navigate, createHashRouter } from "react-router-dom";
import Applications from "./pages/Applications";

const router = createHashRouter([
  {
    path: "/",
    element: <Applications />,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default router;
