const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// ==================== CONFIGURATION ====================
// Change these paths to match your system setup
const GD_FOLDER =
  "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Grim Dawn";
const DEST_FOLDER = path.resolve("data/game");
const ITEMS_DEST_FOLDER = path.resolve("data/resources/items");
// =======================================================

const ARCHIVE_TOOL = path.join(GD_FOLDER, "ArchiveTool.exe");

// Define database targets in strict chronological order
const targets = [
  {
    name: "Base Game Database",
    dbPath: path.join(GD_FOLDER, "database", "database.arz"),
  },
  {
    name: "Ashes of Malmouth (GDX1)",
    dbPath: path.join(GD_FOLDER, "gdx1", "database", "gdx1.arz"),
  },
  {
    name: "Forgotten Gods (GDX2)",
    dbPath: path.join(GD_FOLDER, "gdx2", "database", "gdx2.arz"),
  },
  {
    name: "Fangs of Asterkarn (GDX3)",
    dbPath: path.join(GD_FOLDER, "gdx3", "database", "gdx3.arz"),
  },
];

const itemTargets = [
  {
    name: "Base Game Items",
    archive: path.join(GD_FOLDER, "resources", "Items.arc"),
  },
  {
    name: "Ashes of Malmouth Items (GDX1)",
    archive: path.join(GD_FOLDER, "gdx1", "resources", "Items.arc"),
  },
  {
    name: "Forgotten Gods Items (GDX2)",
    archive: path.join(GD_FOLDER, "gdx2", "resources", "Items.arc"),
  },
  {
    name: "Fangs of Asterkarn Items (GDX3)",
    archive: path.join(GD_FOLDER, "gdx3", "resources", "Items.arc"),
  },
];

function runDatabaseExtraction() {
  // 1. Sanity Checks
  if (!fs.existsSync(ARCHIVE_TOOL)) {
    console.error(
      `❌ Error: ArchiveTool.exe not found at:\n   ${ARCHIVE_TOOL}\nPlease check your GD_FOLDER path.`,
    );
    process.exit(1);
  }

  // 2. Ensure destination exists
  if (!fs.existsSync(DEST_FOLDER)) {
    console.log(`📁 Creating destination folder: ${DEST_FOLDER}`);
    fs.mkdirSync(DEST_FOLDER, { recursive: true });
  }

  console.log("🚀 Starting Grim Dawn database (.dbr) extraction...\n");

  // 3. Process each database file sequentially
  targets.forEach(({ name, dbPath }) => {
    if (!fs.existsSync(dbPath)) {
      console.log(
        `⚠️  Skipping ${name}: Database file not found (Expansion might not be installed).`,
      );
      return;
    }

    console.log(`📦 Unpacking ${name}...`);

    // CRITICAL: We use "-database" instead of "-extract" for .arz files
    const command = `"${ARCHIVE_TOOL}" "${dbPath}" -database "${DEST_FOLDER}"`;

    try {
      // Run synchronously to ensure proper sequential overwriting/merging
      execSync(command, { cwd: GD_FOLDER, stdio: "inherit" });
      console.log(`✅ Successfully extracted ${name}.\n`);
    } catch (error) {
      console.error(`❌ Failed to extract ${name}:`, error.message);
    }
  });

  console.log(
    `🎉 Done! All extracted .dbr record files are available at:\n👉 ${DEST_FOLDER}`,
  );
}

function runItemExtraction() {
  fs.mkdirSync(ITEMS_DEST_FOLDER, { recursive: true });
  console.log("🚀 Starting Grim Dawn item texture (.tex) extraction...\n");

  for (const { name, archive } of itemTargets) {
    if (!fs.existsSync(archive)) {
      console.log(`⚠️  Skipping ${name}: Archive file not found.`);
      continue;
    }

    console.log(`📦 Unpacking ${name}...`);
    const command = `"${ARCHIVE_TOOL}" "${archive}" -extract "${ITEMS_DEST_FOLDER}"`;
    try {
      execSync(command, { cwd: GD_FOLDER, stdio: "inherit" });
      console.log(`✅ Successfully extracted ${name}.\n`);
    } catch (error) {
      console.error(`❌ Failed to extract ${name}:`, error.message);
    }
  }
}

runDatabaseExtraction();
runItemExtraction();
