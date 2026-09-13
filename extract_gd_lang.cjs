const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

// ==================== CONFIGURATION ====================
// Change these paths to match your system setup
const GD_FOLDER =
  "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Grim Dawn";
const DEST_FOLDER = path.resolve("data/lang");
// =======================================================

const ARCHIVE_TOOL = path.join(GD_FOLDER, "ArchiveTool.exe");

// Define targets in order (Base game first, then expansions to overwrite/supplement)
const targets = [
  {
    name: "Base Game",
    archive: path.join(GD_FOLDER, "resources", "Text_EN.arc"),
  },
  {
    name: "Ashes of Malmouth (GDX1)",
    archive: path.join(GD_FOLDER, "gdx1", "resources", "Text_EN.arc"),
  },
  {
    name: "Forgotten Gods (GDX2)",
    archive: path.join(GD_FOLDER, "gdx2", "resources", "Text_EN.arc"),
  },
  {
    name: "Fangs of Asterkarn (GDX3)",
    archive: path.join(GD_FOLDER, "gdx3", "resources", "Text_EN.arc"),
  },
];

function runExtraction() {
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

  console.log("🚀 Starting Grim Dawn localization extraction...\n");

  // 3. Process each archive sequentially
  targets.forEach(({ name, archive }) => {
    if (!fs.existsSync(archive)) {
      console.log(
        `⚠️  Skipping ${name}: Archive file not found (Expansion might not be installed).`,
      );
      return;
    }

    console.log(`📦 Extracting ${name}...`);

    // Wrap paths in quotes to safely handle spaces in folder names
    const command = `"${ARCHIVE_TOOL}" "${archive}" -extract "${DEST_FOLDER}"`;

    try {
      // Run synchronously to ensure proper sequential merging order
      execSync(command, { cwd: GD_FOLDER, stdio: "inherit" });
      console.log(`✅ Successfully extracted ${name}.\n`);
    } catch (error) {
      console.error(`❌ Failed to extract ${name}:`, error.message);
    }
  });

  console.log(
    `🎉 Done! All extracted and merged files are available at:\n👉 ${DEST_FOLDER}`,
  );
}

runExtraction();
