import { createPackagesRegistry, listInternalPackages } from "./lib/registry";
import { PackageManifest } from "./lib/types";

/**
 * Helper function to get all internal package names from a package manifest
 *
 * @param manifest The package.json contents of the target package
 * @param includeDevDependencies Whether to include devDependencies in the
 *   search
 * @returns Array of internal package names
 */
export const getInternalPackages = async (
  manifest: PackageManifest,
  options: {
    includeDevDependencies?: boolean;
    workspaceRoot?: string;
    workspacePackages?: string[];
  } = {}
) => {
  const {
    workspaceRoot = "../..",
    includeDevDependencies = false,
    workspacePackages,
  } = options;

  const packagesRegistry = await createPackagesRegistry(
    workspaceRoot,
    workspacePackages
  );

  return listInternalPackages(manifest, packagesRegistry, {
    includeDevDependencies,
  });
};
