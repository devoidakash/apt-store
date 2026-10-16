import { createBrowserRouter, Navigate } from "react-router";
import App from "./App";
import NotFound from "./components/error/NotFound";
import ManageRepository from "./pages/ManageRepository";
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
    path: "/repositories/:repositoryId",
    element: <ManageRepository />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
