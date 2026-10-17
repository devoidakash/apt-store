import { Navigate, createHashRouter } from "react-router-dom";
import Applications from "./pages/Applications";
import ApplicationDetail from "./pages/ApplicationDetail";

const router = createHashRouter([
  {
    path: "/",
    element: <Applications />,
  },
  {
    path: "/applications/:applicationId",
    element: <ApplicationDetail />,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default router;
