const fs = require('fs')
const path = require('path')

const INPUT_PATH = path.join(__dirname, '..', 'tcc1date1.json')
const OUTPUT_DIR = path.join(__dirname, '..', 'frontend', 'miniprogram', 'assets')

// 可根据实际场景调整缩放与偏移，使得坐标落在合理的墨卡托范围
const SCALE = 0.00001
let originX = 0
let originY = 0

function loadData() {
  const raw = fs.readFileSync(INPUT_PATH, 'utf8')
  return JSON.parse(raw)
}

function toLngLat(x, y) {
  const lng = (x - originX) * SCALE
  const lat = (y - originY) * SCALE
  return [lng, lat]
}

function rectToPolygon(feature) {
  const { x, y, width, height } = feature
  const p1 = toLngLat(x, y)
  const p2 = toLngLat(x + width, y)
  const p3 = toLngLat(x + width, y + height)
  const p4 = toLngLat(x, y + height)
  return [p1, p2, p3, p4, p1]
}

function buildGeoJson(data) {
  if (Array.isArray(data.parkingSpaces) && data.parkingSpaces.length > 0) {
    originX = Math.min(...data.parkingSpaces.map(s => s.x))
    originY = Math.min(...data.parkingSpaces.map(s => s.y))
  }
  const features = []

  const addFeatures = (items, type) => {
    if (!Array.isArray(items)) return
    items.forEach(item => {
      const geometryType = item.width && item.height ? 'Polygon' : 'Point'
      const geometry = geometryType === 'Polygon'
        ? { type: 'Polygon', coordinates: [rectToPolygon(item)] }
        : { type: 'Point', coordinates: toLngLat(item.x, item.y) }
      features.push({
        type: 'Feature',
        properties: { id: item.id, type },
        geometry
      })
    })
  }

  addFeatures(data.parkingSpaces, 'parking_spot')
  addFeatures(data.walls, 'wall')
  addFeatures(data.obstacles, 'obstacle')
  addFeatures(data.entrances, 'entrance')
  addFeatures(data.elevators, 'elevator')
  addFeatures(data.trafficSigns, 'traffic_sign')

  return { type: 'FeatureCollection', features }
}

function buildNavigationGraph(data) {
  const nodes = []
  const edges = []

  if (Array.isArray(data.parkingSpaces)) {
    data.parkingSpaces.forEach((space, index) => {
      const centerX = space.x + space.width / 2
      const centerY = space.y + space.height / 2
      nodes.push({ id: `node-${space.id}`, x: centerX, y: centerY })

      const previous = data.parkingSpaces[index - 1]
      if (previous) {
        edges.push({
          from: `node-${previous.id}`,
          to: `node-${space.id}`,
          oneway: false
        })
      }
    })
  }

  return { nodes, edges }
}

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
}

function saveJson(filename, data) {
  const outputPath = path.join(OUTPUT_DIR, filename)
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8')
  console.log(`✔ 写入 ${outputPath}`)
}

function main() {
  const data = loadData()
  ensureOutputDir()

  const geojson = buildGeoJson(data)
  const navGraph = buildNavigationGraph(data)

  saveJson('map_elements.geojson', geojson)
  saveJson('navigation_graph.json', navGraph)
  console.log('✅ 数据转换完成')
}

main()

