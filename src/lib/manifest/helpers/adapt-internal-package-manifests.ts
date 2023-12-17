import fs from "fs-extra";
import path from "node:path";
import { omit } from "ramda";
import { useConfig } from "~/lib/config";
import { usePackageManager } from "~/lib/package-manager";
import type { PackagesRegistry } from "~/lib/types";
import { adaptManifestInternalDeps } from "./adapt-manifest-internal-deps";

/**
 * Adapt the manifest files of all the isolated internal packages (excluding the
 * target package), so that their dependencies point to the other isolated
 * packages in the same folder.
 */
export async function adaptInternalPackageManifests(
  internalPackageNames: string[],
  packagesRegistry: PackagesRegistry,
  isolateDir: string
) {
  const packageManager = usePackageManager();
  const { includeDevDependencies } = useConfig();

  await Promise.all(
    internalPackageNames.map(async (packageName) => {
      const { manifest, rootRelativeDir } = packagesRegistry[packageName];

      const outputManifest =
        packageManager.name === "pnpm"
          ? Object.assign(
              /**
               * For internal dependencies we want to omit the peerDependencies,
               * because installing these is the responsibility of the consuming
               * app / service, and otherwise the frozen lockfile install will
               * error since the package file contains something that is not
               * referenced in the lockfile.
               */
              omit(["devDependencies", "peerDependencies"], manifest),
              {
                dependencies: manifest.dependencies,
                devDependencies: includeDevDependencies
                  ? manifest.devDependencies
                  : undefined,
              }
            )
          : adaptManifestInternalDeps(
              {
                manifest,
                packagesRegistry,
                parentRootRelativeDir: rootRelativeDir,
              },
              { includeDevDependencies }
            );

      await fs.writeFile(
        path.join(isolateDir, rootRelativeDir, "package.json"),
        JSON.stringify(outputManifest, null, 2)
      );
    })
  );
}