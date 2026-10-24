import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { PackageStatus } from "../types/package-status";

interface PackageStatusResult {
  status: PackageStatus | null;
  isLoading: boolean;
  refetch: () => void;
}

export function usePackageStatus(
  packageName: string,
  latestVersion: string,
): PackageStatusResult {
  const [status, setStatus] = useState<PackageStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requestNumber, setRequestNumber] = useState(0);

  const refetch = useCallback(() => {
    setRequestNumber((current) => current + 1);
  }, []);

  useEffect(() => {
    let isCurrentRequest = true;
    setStatus(null);
    setIsLoading(true);

    if (!packageName || !latestVersion) {
      setStatus("InstallCheckFailed");
      setIsLoading(false);
      return () => {
        isCurrentRequest = false;
      };
    }

    async function checkStatus() {
      try {
        const result = await invoke<PackageStatus>("check_package_status", {
          packageName,
          latestVersion,
        });
        if (isCurrentRequest) setStatus(result);
      } catch (error) {
        console.error("Could not check package status.", error);
        if (isCurrentRequest) setStatus("InstallCheckFailed");
      } finally {
        if (isCurrentRequest) setIsLoading(false);
      }
    }

    void checkStatus();
    return () => {
      isCurrentRequest = false;
    };
  }, [packageName, latestVersion, requestNumber]);

  return { status, isLoading, refetch };
}
