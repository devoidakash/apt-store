import { BadgeCheck, LayoutGrid, Database, FileText } from "lucide-react";
import Layout from "./components/dashboard/Layout";
import Repository from "./pages/repository/CreateRepository";

const sidebarLinks = [
  {
    to: "/repositories",
    label: "Repositories",
    icon: Database,
    end: false,
  },
  {
    to: "/applications",
    label: "Applications",
    icon: LayoutGrid,
    end: false,
    children: [
      {
        to: "/applications?applicationStatus=draft",
        label: "Draft",
        icon: FileText,
      },
      {
        to: "/applications?applicationStatus=published",
        label: "Published",
        icon: BadgeCheck,
      },
    ],
  },
];

export default function App() {
  return (
    <Layout sidebarLinks={sidebarLinks} searchPlaceholder="Search packages...">
      <Repository />
    </Layout>
  );
}
