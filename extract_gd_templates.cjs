const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

// ==================== CONFIGURATION ====================
// Change this path to match your Grim Dawn installation.
const GD_FOLDER = 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Grim Dawn'
const ARCHIVE = path.join(GD_FOLDER, 'database', 'templates.arc')
const DEST_FOLDER = path.resolve('data/game')
// =======================================================

const ARCHIVE_TOOL = path.join(GD_FOLDER, 'ArchiveTool.exe')

function runTemplateExtraction() {
  if (!fs.existsSync(ARCHIVE_TOOL)) {
    console.error(`❌ Error: ArchiveTool.exe not found at:\n   ${ARCHIVE_TOOL}\nPlease check your GD_FOLDER path.`)
    process.exit(1)
  }

  if (!fs.existsSync(ARCHIVE)) {
    console.error(`❌ Error: templates.arc not found at:\n   ${ARCHIVE}\nPlease check your Grim Dawn installation.`)
    process.exit(1)
  }

  fs.mkdirSync(DEST_FOLDER, { recursive: true })
  console.log('🚀 Extracting Grim Dawn template definitions...\n')

  const command = `"${ARCHIVE_TOOL}" "${ARCHIVE}" -extract "${DEST_FOLDER}"`

  try {
    execSync(command, { cwd: GD_FOLDER, stdio: 'inherit' })
    console.log(`🎉 Done! Template files were extracted into:\n👉 ${DEST_FOLDER}`)
  } catch (error) {
    console.error('❌ Failed to extract templates:', error.message)
    process.exit(1)
  }
}

runTemplateExtraction()
