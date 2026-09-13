const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// ==================== CONFIGURATION ====================
// Change these paths to match your system setup
const GD_FOLDER =
  "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Grim Dawn";
const DEST_FOLDER = path.resolve("data/resources");
// =======================================================

const ARCHIVE_TOOL = path.join(GD_FOLDER, "ArchiveTool.exe");

const resourceRoots = [
  {
    name: "Base Game Resources",
    dir: path.join(GD_FOLDER, "resources"),
  },
  {
    name: "Ashes of Malmouth Resources (GDX1)",
    dir: path.join(GD_FOLDER, "gdx1", "resources"),
  },
  {
    name: "Forgotten Gods Resources (GDX2)",
    dir: path.join(GD_FOLDER, "gdx2", "resources"),
  },
  {
    name: "Fangs of Asterkarn Resources (GDX3)",
    dir: path.join(GD_FOLDER, "gdx3", "resources"),
  },
];

function findArcFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  const files = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...findArcFiles(entryPath));
      continue;
    }

    if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".arc") {
      files.push(entryPath);
    }
  }

  return files;
}

function runExtraction() {
  if (!fs.existsSync(ARCHIVE_TOOL)) {
    console.error(
      `❌ Error: ArchiveTool.exe not found at:\n   ${ARCHIVE_TOOL}\nPlease check your GD_FOLDER path.`,
    );
    process.exit(1);
  }

  if (!fs.existsSync(DEST_FOLDER)) {
    console.log(`📁 Creating destination folder: ${DEST_FOLDER}`);
    fs.mkdirSync(DEST_FOLDER, { recursive: true });
  }

  console.log("🚀 Starting Grim Dawn resource extraction...\n");

  let totalArchives = 0;
  let totalSucceeded = 0;

  for (const { name, dir } of resourceRoots) {
    const archives = findArcFiles(dir);

    if (archives.length === 0) {
      console.log(`⚠️  Skipping ${name}: no .arc files found.`);
      continue;
    }

    console.log(`📦 Processing ${name} (${archives.length} archive(s))...`);

    for (const archive of archives) {
      const relative = path.relative(GD_FOLDER, archive);
      console.log(`   Extracting ${relative}...`);

      const command = `"${ARCHIVE_TOOL}" "${archive}" -extract "${DEST_FOLDER}"`;

      try {
        execSync(command, { cwd: GD_FOLDER, stdio: "inherit" });
        totalSucceeded += 1;
        totalArchives += 1;
      } catch (error) {
        console.error(`❌ Failed to extract ${relative}:`, error.message);
      }
    }

    console.log(`✅ Finished ${name}.\n`);
  }

  console.log(
    `🎉 Done! ${totalSucceeded} archive(s) extracted into:\n👉 ${DEST_FOLDER}`,
  );
  console.log(`📊 Total processed: ${totalArchives}`);
}

runExtraction();
