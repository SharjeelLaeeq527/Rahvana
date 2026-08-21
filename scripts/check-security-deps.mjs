//Fails CI if security-critical packages were downgraded or unpinned.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const packageJsonPath = join(root, "package.json");

const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const require = createRequire(import.meta.url);

/**
 * Minimum security-approved versions.
 *
 * pdfjs-dist is additionally required to be pinned exactly
 * and enforced through package.json overrides.
 */
const MIN = {
  "pdfjs-dist": "6.2.108",
  dompurify: "3.2.0",
  "file-type": "19.0.0",
  jsdom: "26.0.0",
};

//Parse a semantic version into numeric components.
function parseSemver(raw) {
  const cleaned = String(raw).replace(/^[^\d]*/, "");

  const [major, minor, patch] = cleaned.split(".").map((value) => Number.parseInt(value, 10) || 0);

  return {
    major,
    minor,
    patch,
  };
}

//Check whether installed >= minimum.
function gte(installed, minimum) {
  const a = parseSemver(installed);
  const b = parseSemver(minimum);

  if (a.major !== b.major) {
    return a.major > b.major;
  }

  if (a.minor !== b.minor) {
    return a.minor > b.minor;
  }

  return a.patch >= b.patch;
}

const failures = [];

/**
 * Verify that a dependency is declared in package.json.
 *
 * pdfjs-dist must be pinned exactly.
 */
function checkDeclared(name, expectedExact) {
  const declared = pkg.dependencies?.[name] || pkg.devDependencies?.[name];

  if (!declared) {
    failures.push(`${name} is missing from package.json`);
    return;
  }

  if (name === "pdfjs-dist" && declared !== expectedExact) {
    failures.push(`pdfjs-dist must be pinned exactly to ${expectedExact}, found "${declared}"`);
  }
}

/**
 * Resolve the installed package and read its package.json
 * without relying on require("package/package.json").
 *
 * This is important because modern packages can block
 * "./package.json" through their "exports" field.
 */
function getInstalledVersion(name) {
  try {
    const packageEntry = require.resolve(name, {
      paths: [root],
    });

    let currentDir = dirname(packageEntry);

    while (true) {
      const packageJsonPath = join(currentDir, "package.json");

      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

        if (packageJson.name === name) {
          return packageJson.version;
        }
      } catch {
        // package.json does not exist or could not be parsed.
      }

      const parentDir = dirname(currentDir);

      if (parentDir === currentDir) {
        break;
      }

      currentDir = parentDir;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Verify installed package version.
 *
 * Returns the installed version so it can also be printed
 * in the final success output.
 */
function checkInstalled(name, minimum) {
  const version = getInstalledVersion(name);

  if (!version) {
    failures.push(`${name} is not installed in node_modules`);

    return null;
  }

  if (!gte(version, minimum)) {
    failures.push(`${name}@${version} is below required minimum ${minimum}`);
  }

  return version;
}

//1. Verify package.json declarations.
checkDeclared("pdfjs-dist", MIN["pdfjs-dist"]);

checkDeclared("dompurify");
checkDeclared("file-type");

/**
 * 2. Verify pdfjs-dist override.
 *
 * This prevents nested dependencies from pulling in
 * an older vulnerable pdfjs-dist version.
 */
if (pkg.overrides?.["pdfjs-dist"] !== MIN["pdfjs-dist"]) {
  failures.push(`package.json overrides.pdfjs-dist must be "${MIN["pdfjs-dist"]}"`);
}

// 3. Verify actually installed versions.
const installedVersions = {
  "pdfjs-dist": checkInstalled("pdfjs-dist", MIN["pdfjs-dist"]),

  dompurify: checkInstalled("dompurify", MIN.dompurify),

  "file-type": checkInstalled("file-type", MIN["file-type"]),

  jsdom: checkInstalled("jsdom", MIN.jsdom),
};

// 4. Fail CI if anything is invalid.
if (failures.length > 0) {
  console.error("Security dependency check failed:\n");

  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }

  process.exit(1);
}

// 5. Success output.
console.log("Security dependency pins OK");
console.log(`  pdfjs-dist  ${installedVersions["pdfjs-dist"]}`);
console.log(`  dompurify   ${installedVersions.dompurify}`);
console.log(`  file-type   ${installedVersions["file-type"]}`);
console.log(`  jsdom       ${installedVersions.jsdom}`);
