#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const SOURCE_FILE = path.resolve(__dirname, '..', 'tcc1date1.json')
const OUTPUT_DIR = path.resolve(__dirname, '..', 'frontend', 'miniprogram', 'assets', 'map')
const MAP_ELEMENTS_FILE = path.join(OUTPUT_DIR, 'map_elements.geojson')
const NAV_GRAPH_FILE = path.join(OUTPUT_DIR, 'navigation_graph.json')

const BASE_LNG = 113.32452
const BASE_LAT = 23.09999
const COORD_SCALE = 0.00001

function project(x, y) {
  return [BASE_LNG + x * COORD_SCALE, BASE_LAT + y * COORD_SCALE]
}

function rectToPolygon(feature) {
  const { x, y, width, height } = feature
  return [
    project(x, y),
    project(x + width, y),
    project(x + width, y + height),
    project(x, y + height),
    project(x, y)
  ]
}

function toFeature(feature, type) {
  return {
    type: 'Feature',
    properties: {
      id: feature.id,
      type
    },
    geometry: {
      type: 'Polygon',
      coordinates: [rectToPolygon(feature)]
    }
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function calculateBounds(parkingSpaces) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  parkingSpaces.forEach(({ x, y, width, height }) => {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x + width)
    maxY = Math.max(maxY, y + height)
  })
  return { minX, minY, maxX, maxY }
}

function buildNavigationGraph(data) {
  const { parkingSpaces, entrances = [] } = data
  const nodes = []
  const edges = []

  if (!parkingSpaces || parkingSpaces.length === 0) {
    return { nodes, edges }
  }

  const bounds = calculateBounds(parkingSpaces)
  const { minX, minY, maxX, maxY } = bounds

  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  const corners = [
    { id: 'node-nw', x: minX, y: minY },
    { id: 'node-ne', x: maxX, y: minY },
    { id: 'node-se', x: maxX, y: maxY },
    { id: 'node-sw', x: minX, y: maxY },
    { id: 'node-center', x: centerX, y: centerY }
  ]

  const entranceNodes = entrances.map((entrance, idx) => {
    const cx = entrance.x + entrance.width / 2
    const cy = entrance.y + entrance.height / 2
    return { id: `node-entrance-${idx + 1}`, x: cx, y: cy }
  })

  const allNodes = [...corners, ...entranceNodes]

  allNodes.forEach(node => {
    nodes.push({
      id: node.id,
      coordinates: project(node.x, node.y)
    })
  })

  const connect = (from, to, oneway = false) => {
    edges.push({ from, to, oneway })
    if (!oneway) {
      edges.push({ from: to, to: from, oneway })
    }
  }

  connect('node-nw', 'node-ne')
  connect('node-ne', 'node-se')
  connect('node-se', 'node-sw')
  connect('node-sw', 'node-nw')

  entranceNodes.forEach(node => {
    connect(node.id, 'node-center')
  })

  return { nodes, edges }
}

function main() {
  if (!fs.existsSync(SOURCE_FILE)) {
    console.error('[ERROR] Cannot find source file:', SOURCE_FILE)
    process.exit(1)
  }

  const raw = fs.readFileSync(SOURCE_FILE, 'utf-8')
  const data = JSON.parse(raw)

  const features = []
  const pushFeatures = (items = [], type) => {
    items.forEach(item => {
      features.push(toFeature(item, type))
    })
  }

  pushFeatures(data.parkingSpaces, 'parking_spot')
  pushFeatures(data.walls, 'wall')
  pushFeatures(data.obstacles, 'obstacle')
  pushFeatures(data.entrances, 'entrance')

  const mapElements = {
    type: 'FeatureCollection',
    features
  }

  const navigationGraph = buildNavigationGraph(data)

  ensureDir(OUTPUT_DIR)
  fs.writeFileSync(MAP_ELEMENTS_FILE, JSON.stringify(mapElements, null, 2), 'utf-8')
  fs.writeFileSync(NAV_GRAPH_FILE, JSON.stringify(navigationGraph, null, 2), 'utf-8')

  console.log('[SUCCESS] Generated map data:')
  console.log('  -', MAP_ELEMENTS_FILE)
  console.log('  -', NAV_GRAPH_FILE)
}

main()

