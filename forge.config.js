module.exports = {
  make_targets: {
    darwin: ["zip"],
    linux: ["zip"],
    win32: ["squirrel"],
  },
  electronPackagerConfig: {
    packageManager: false,
  },
  electronInstallerDebian: {},
  electronInstallerRedhat: {},
  electronWinstallerConfig: {},
  windowsStoreConfig: {},
  github_repository: {
    owner: "",
    name: "",
  },
}
