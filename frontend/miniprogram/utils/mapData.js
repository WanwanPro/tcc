import rawMapData from '../assets/tcc1date1.json'

// 在一个虚拟经纬度平面上渲染，将画布坐标映射到真实地理坐标
const BASE_LNG = 121.560000
const BASE_LAT = 31.230000
const COORD_SCALE = 0.00001

const toLngLat = (x, y) => {
  return [BASE_LNG + x * COORD_SCALE, BASE_LAT + y * COORD_SCALE]
}

const polygonFromRect = (x, y, width, height) => {
  const [lng1, lat1] = toLngLat(x, y)
  const [lng2, lat2] = toLngLat(x + width, y + height)

  return [[
    [lng1, lat1],
    [lng2, lat1],
    [lng2, lat2],
    [lng1, lat2],
    [lng1, lat1]
  ]]
}

export const getMapElementsGeoJSON = () => {
  const features = []

  if (rawMapData.parkingSpaces) {
    rawMapData.parkingSpaces.forEach(space => {
      features.push({
        type: 'Feature',
        properties: {
          id: space.id,
          type: 'parking_spot'
        },
        geometry: {
          type: 'Polygon',
          coordinates: polygonFromRect(space.x, space.y, space.width, space.height)
        }
      })
    })
  }

  if (rawMapData.walls) {
    rawMapData.walls.forEach(wall => {
      features.push({
        type: 'Feature',
        properties: {
          id: wall.id,
          type: 'wall'
        },
        geometry: {
          type: 'Polygon',
          coordinates: polygonFromRect(wall.x, wall.y, wall.width, wall.height)
        }
      })
    })
  }

  if (rawMapData.obstacles) {
    rawMapData.obstacles.forEach(obstacle => {
      features.push({
        type: 'Feature',
        properties: {
          id: obstacle.id,
          type: 'obstacle'
        },
        geometry: {
          type: 'Polygon',
          coordinates: polygonFromRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
        }
      })
    })
  }

  if (rawMapData.trafficSigns) {
    rawMapData.trafficSigns.forEach(sign => {
      features.push({
        type: 'Feature',
        properties: {
          id: sign.id,
          type: `sign-${sign.type || 'unknown'}`
        },
        geometry: {
          type: 'Point',
          coordinates: toLngLat(sign.x, sign.y)
        }
      })
    })
  }

  if (rawMapData.entrances) {
    rawMapData.entrances.forEach(entrance => {
      features.push({
        type: 'Feature',
        properties: {
          id: entrance.id,
          type: 'entrance'
        },
        geometry: {
          type: 'Polygon',
          coordinates: polygonFromRect(entrance.x, entrance.y, entrance.width, entrance.height)
        }
      })
    })
  }

  return {
    type: 'FeatureCollection',
    features
  }
}

// 简化导航图：选取停车场主通道上的一些节点
const navigationGraph = {
  nodes: [
    { id: 'node-entrance', x: 150, y: 820 },
    { id: 'node-a1', x: 280, y: 620 },
    { id: 'node-a2', x: 480, y: 620 },
    { id: 'node-a3', x: 720, y: 620 },
    { id: 'node-a4', x: 960, y: 620 },
    { id: 'node-a5', x: 1220, y: 620 },
    { id: 'node-b1', x: 280, y: 420 },
    { id: 'node-b2', x: 480, y: 420 },
    { id: 'node-b3', x: 720, y: 420 },
    { id: 'node-b4', x: 960, y: 420 },
    { id: 'node-b5', x: 1220, y: 420 },
    { id: 'node-destination', x: 1500, y: 320 }
  ],
  edges: [
    ['node-entrance', 'node-a1'],
    ['node-a1', 'node-a2'],
    ['node-a2', 'node-a3'],
    ['node-a3', 'node-a4'],
    ['node-a4', 'node-a5'],
    ['node-a5', 'node-destination'],
    ['node-a1', 'node-b1'],
    ['node-a2', 'node-b2'],
    ['node-a3', 'node-b3'],
    ['node-a4', 'node-b4'],
    ['node-a5', 'node-b5'],
    ['node-b1', 'node-b2'],
    ['node-b2', 'node-b3'],
    ['node-b3', 'node-b4'],
    ['node-b4', 'node-b5'],
    ['node-b5', 'node-destination']
  ]
}

export const getNavigationGraph = () => navigationGraph

export const convertPathToLngLat = (pathPoints) => {
  return pathPoints.map(point => toLngLat(point.x, point.y))
}

export const getLngLatFromNode = (nodeId) => {
  const node = navigationGraph.nodes.find(n => n.id === nodeId)
  if (!node) return null
  return toLngLat(node.x, node.y)
}

export const getBaseCoordinate = () => ({
  lng: BASE_LNG,
  lat: BASE_LAT,
  scale: COORD_SCALE
})

export { toLngLat }


