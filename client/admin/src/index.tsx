import { createBrowserRouter, Navigate } from "react-router";
import App from "./App";
import NotFound from "./components/error/NotFound";
import Applications from "./pages/applications/Applications";
import ManageRepository from "./pages/repository/ManageRepository";
import Repositories from "./pages/repository/Repositories";

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
    path: "/applications",
    element: <Applications />,
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
