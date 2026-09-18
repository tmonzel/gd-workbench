const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')
const sharp = require('sharp')

const RESOURCE_DIR = path.resolve('data/resources')
const OUTPUT_DIR = path.resolve('public/assets')
const TEMP_DDS_DIR = path.join(OUTPUT_DIR, 'temp_dds')
const ITEMS_JSON = path.resolve('public/data/items.json')
const TEXCONV_CANDIDATES = [
  process.env.TEXCONV_PATH,
  path.resolve('texconv.exe'),
  'C:\\Users\\tommo\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Microsoft.DirectXTex.Texconv_Microsoft.Winget.Source_8wekyb3d8bbwe\\texconv.exe',
].filter(Boolean)

const findTexconv = () => {
  const toolPath = TEXCONV_CANDIDATES.find((candidate) => fs.existsSync(candidate))
  if (!toolPath) throw new Error('texconv.exe not found. Set TEXCONV_PATH or place texconv.exe in the project root.')
  return path.resolve(toolPath)
}

const getTexFiles = (directory) => {
  const files = []
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...getTexFiles(entryPath))
    else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.tex') {
      files.push(entryPath)
    }
  }
  return files
}

const getReferencedTexFiles = () => {
  if (!fs.existsSync(ITEMS_JSON)) return getTexFiles(RESOURCE_DIR)
  const items = JSON.parse(fs.readFileSync(ITEMS_JSON, 'utf8'))
  const paths = new Set()
  for (const item of items) {
    if (typeof item.image !== 'string' || !item.image.startsWith('/assets/')) continue
    const relativePath = item.image.slice('/assets/'.length)
    if (!relativePath.toLowerCase().endsWith('.png') && !relativePath.toLowerCase().endsWith('.webp')) continue
    const sourcePath = path.join(RESOURCE_DIR, relativePath.replace(/\.(png|webp)$/i, '.tex'))
    if (fs.existsSync(sourcePath)) paths.add(sourcePath)
  }
  const masterySkillsPath = path.resolve('public/data/mastery-skills.json')
  if (fs.existsSync(masterySkillsPath)) {
    const skillsets = JSON.parse(fs.readFileSync(masterySkillsPath, 'utf8'))
    for (const skills of Object.values(skillsets)) {
      for (const skill of skills) {
        if (typeof skill.icon !== 'string') continue
        const sourcePath = path.join(RESOURCE_DIR, skill.icon.slice('/assets/'.length).replace(/\.webp$/i, '.tex'))
        if (fs.existsSync(sourcePath)) paths.add(sourcePath)
      }
    }
  }
  return [...paths]
}

const createDdsBuffer = (texBuffer, sourcePath) => {
  if (texBuffer.subarray(0, 4).toString('ascii') !== 'TEX\x02') {
    throw new Error(`${sourcePath} does not have a supported Grim Dawn TEX header`)
  }
  if (texBuffer.length <= 16 || texBuffer.subarray(12, 16).toString('ascii') !== 'DDSR') {
    throw new Error(`${sourcePath} does not contain the expected DDSR header`)
  }
  return Buffer.concat([Buffer.from('DDS '), texBuffer.subarray(16)])
}

const readBitmapPixels = (texBuffer, sourcePath) => {
  if (texBuffer.subarray(0, 4).toString('ascii') !== 'TEX\x02') {
    throw new Error(`${sourcePath} does not have a supported Grim Dawn TEX header`)
  }
  if (texBuffer.subarray(12, 16).toString('ascii') !== 'DDSR') {
    throw new Error(`${sourcePath} does not contain the expected DDSR header`)
  }

  const ddsHeader = texBuffer.subarray(16, 140)
  const height = ddsHeader.readUInt32LE(8)
  const width = ddsHeader.readUInt32LE(12)
  const pixelFormatFlags = ddsHeader.readUInt32LE(76)
  const bitsPerPixel = ddsHeader.readUInt32LE(84)
  const pixels = texBuffer.subarray(140)
  const channels = bitsPerPixel === 32 ? 4 : bitsPerPixel === 24 ? 3 : 0
  const expectedLength = width * height * channels

  if (pixelFormatFlags !== 0x40 || channels === 0) return null
  if (pixels.length < expectedLength) {
    throw new Error(`${sourcePath} bitmap payload is incomplete: expected ${expectedLength}, got ${pixels.length}`)
  }

  const rgbaPixels = Buffer.from(pixels.subarray(0, expectedLength))
  for (let index = 0; index < rgbaPixels.length; index += channels) {
    const blue = rgbaPixels[index]
    rgbaPixels[index] = rgbaPixels[index + 2]
    rgbaPixels[index + 2] = blue
  }

  return {
    width,
    height,
    channels,
    pixels: rgbaPixels,
  }
}

const convertTexFile = async (sourcePath, texconvPath) => {
  const relativePath = path.relative(RESOURCE_DIR, path.dirname(sourcePath))
  const outputFolder = path.join(OUTPUT_DIR, relativePath)
  const tempFolder = path.join(TEMP_DDS_DIR, relativePath)
  const baseName = path.basename(sourcePath, '.tex')
  const tempDdsPath = path.join(tempFolder, `${baseName}.dds`)

  fs.mkdirSync(tempFolder, { recursive: true })
  fs.mkdirSync(outputFolder, { recursive: true })
  const texBuffer = fs.readFileSync(sourcePath)
  const bitmap = readBitmapPixels(texBuffer, sourcePath)

  if (bitmap) {
    await sharp(bitmap.pixels, {
      raw: {
        width: bitmap.width,
        height: bitmap.height,
        channels: bitmap.channels,
      },
    })
      .webp({
        quality: 100,
        lossless: true,
        alphaQuality: 100,
        effort: 6,
        chromaSubsampling: '4:4:4',
      })
      .toFile(path.join(outputFolder, `${baseName}.webp`))
    return
  }

  fs.writeFileSync(tempDdsPath, createDdsBuffer(texBuffer, sourcePath))

  execFileSync(texconvPath, ['-ft', 'webp', '-m', '1', '-y', '-o', outputFolder, tempDdsPath], {
    cwd: path.dirname(texconvPath),
    stdio: 'ignore',
  })
  fs.rmSync(tempDdsPath, { force: true })
}

const main = async () => {
  if (!fs.existsSync(RESOURCE_DIR)) throw new Error(`Resource directory not found: ${RESOURCE_DIR}`)
  const texconvPath = findTexconv()
  const texFiles = getReferencedTexFiles()
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  fs.rmSync(TEMP_DDS_DIR, { recursive: true, force: true })
  console.log(`Converting ${texFiles.length} TEX files with ${texconvPath}`)

  let converted = 0
  let failed = 0
  for (const sourcePath of texFiles) {
    try {
      await convertTexFile(sourcePath, texconvPath)
      converted += 1
    } catch (error) {
      failed += 1
      console.error(`[Failed] ${path.relative(process.cwd(), sourcePath)}: ${error.message}`)
    }
  }
  fs.rmSync(TEMP_DDS_DIR, { recursive: true, force: true })
  console.log(`Finished: ${converted} converted, ${failed} failed.`)
  if (failed > 0) process.exitCode = 1
}

main()
