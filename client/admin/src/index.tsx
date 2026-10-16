import { createBrowserRouter, Navigate } from "react-router";
import App from "./App";
import NotFound from "./components/error/NotFound";
import Repositories from "./pages/Repositories";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/repositories" replace />,
  },
  {
    path: "/repositories",
    element: <Repositories />,
  },
  {
    path: "/repositories/new",
    element: <App />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
