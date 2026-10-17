import { getIcon } from "../../utils/get-Images";
import * as repository from "./repository";

export async function getApplications() {
  const applications = await repository.fetchApplications();

  return applications.map((application) => {
    if (!application) return null;

    return {
      ...application,
      icon: getIcon(
        String(application.id),
        application.iconUpdatedAt instanceof Date
          ? application.iconUpdatedAt
          : null,
      ),
    };
  });
}
