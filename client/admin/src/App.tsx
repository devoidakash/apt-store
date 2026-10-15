import { Database } from "lucide-react";
import Layout from "./components/dashboard/Layout";
import Repository from "./pages/Repository";

const sidebarLinks = [
  {
    to: "/repository",
    label: "Repository",
    icon: Database,
  },
];

export default function App() {
  return (
    <Layout sidebarLinks={sidebarLinks} searchPlaceholder="Search packages...">
      <Repository />
    </Layout>
  );
}
