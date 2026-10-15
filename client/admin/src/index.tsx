import { createBrowserRouter, Navigate } from "react-router";
import App from "./App";
import NotFound from "./components/error/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/repository" replace />,
  },
  {
    path: "/repository",
    element: <App />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
