export type PackageStatus =
  | "NotInstalled"
  | "UpToDate"
  | "UpdateAvailable"
  | "OnHold"
  | "InstallCheckFailed"
  | "VersionComparisonFailed";
