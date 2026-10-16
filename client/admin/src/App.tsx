import { Database } from "lucide-react";
import Layout from "./components/dashboard/Layout";
import Repository from "./pages/CreateRepository";

const sidebarLinks = [
  {
    to: "/repositories",
    label: "Repositories",
    icon: Database,
    end: false,
  },
];

export default function App() {
  return (
    <Layout sidebarLinks={sidebarLinks} searchPlaceholder="Search packages...">
      <Repository />
    </Layout>
  );
}
