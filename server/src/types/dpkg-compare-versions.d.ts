declare module "dpkg-compare-versions" {
  const compareDpkgVersions: (
    firstVersion: string,
    secondVersion: string,
  ) => number;
  export default compareDpkgVersions;
}
