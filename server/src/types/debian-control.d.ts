declare module "debian-control" {
  export function parse(
    controlFile: string,
  ): import("../module/admin/repository/helpers/apt-metadata").Package;
}
