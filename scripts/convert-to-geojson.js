/**
 * 将 tcc1date1.json 转换为 Mapbox 需要的 GeoJSON 格式
 * 由于原数据是画布坐标，我们需要进行坐标转换
 */

const fs = require('fs');
const path = require('path');

// 读取原始数据
const rawData = require('../tcc1date1.json');

// 坐标转换函数 - 将画布坐标转换为伪地理坐标
// 假设画布中心为停车场中心，1像素 = 0.00001度
function canvasToGeo(x, y) {
  const centerLng = 113.0;  // 假设停车场中心经度
  const centerLat = 23.0;   // 假设停车场中心纬度
  const scale = 0.00001;    // 缩放比例
  
  return [
    centerLng + (x - 1200) * scale,  // 1200 是画布中心X
    centerLat + (400 - y) * scale    // 400 是画布中心Y，Y轴反转
  ];
}

// 转换停车位为 Polygon
function convertParkingSpaces(spaces) {
  return spaces.map(space => ({
    type: 'Feature',
    properties: {
      id: space.id,
      type: 'parking_spot',
      status: 'available'  // 默认可用
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        canvasToGeo(space.x, space.y),
        canvasToGeo(space.x + space.width, space.y),
        canvasToGeo(space.x + space.width, space.y + space.height),
        canvasToGeo(space.x, space.y + space.height),
        canvasToGeo(space.x, space.y)
      ]]
    }
  }));
}

// 转换墙体
function convertWalls(walls) {
  return walls.map(wall => ({
    type: 'Feature',
    properties: {
      id: wall.id,
      type: 'wall'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        canvasToGeo(wall.x, wall.y),
        canvasToGeo(wall.x + wall.width, wall.y),
        canvasToGeo(wall.x + wall.width, wall.y + wall.height),
        canvasToGeo(wall.x, wall.y + wall.height),
        canvasToGeo(wall.x, wall.y)
      ]]
    }
  }));
}

// 转换入口
function convertEntrances(entrances) {
  return entrances.map(entrance => ({
    type: 'Feature',
    properties: {
      id: entrance.id,
      type: 'entrance',
      name: '入口'
    },
    geometry: {
      type: 'Point',
      coordinates: canvasToGeo(
        entrance.x + entrance.width / 2,
        entrance.y + entrance.height / 2
      )
    }
  }));
}

// 转换电梯
function convertElevators(elevators) {
  return elevators.map(elevator => ({
    type: 'Feature',
    properties: {
      id: elevator.id,
      type: 'elevator',
      name: '电梯'
    },
    geometry: {
      type: 'Point',
      coordinates: canvasToGeo(
        elevator.x + elevator.width / 2,
        elevator.y + elevator.height / 2
      )
    }
  }));
}

// 转换障碍物
function convertObstacles(obstacles) {
  return obstacles.map(obstacle => ({
    type: 'Feature',
    properties: {
      id: obstacle.id,
      type: 'obstacle'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        canvasToGeo(obstacle.x, obstacle.y),
        canvasToGeo(obstacle.x + obstacle.width, obstacle.y),
        canvasToGeo(obstacle.x + obstacle.width, obstacle.y + obstacle.height),
        canvasToGeo(obstacle.x, obstacle.y + obstacle.height),
        canvasToGeo(obstacle.x, obstacle.y)
      ]]
    }
  }));
}

// 转换交通标志
function convertTrafficSigns(signs) {
  return signs.map(sign => ({
    type: 'Feature',
    properties: {
      id: sign.id,
      type: 'traffic_sign',
      signType: sign.type
    },
    geometry: {
      type: 'Point',
      coordinates: canvasToGeo(sign.x, sign.y)
    }
  }));
}

// 生成 GeoJSON
const geojson = {
  type: 'FeatureCollection',
  features: [
    ...convertParkingSpaces(rawData.parkingSpaces),
    ...convertWalls(rawData.walls),
    ...convertEntrances(rawData.entrances),
    ...convertElevators(rawData.elevators),
    ...convertObstacles(rawData.obstacles),
    ...convertTrafficSigns(rawData.trafficSigns)
  ]
};

// 保存 GeoJSON
const outputPath = path.join(__dirname, '../frontend/miniprogram/assets/map_elements.geojson');
fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));

console.log(`✅ GeoJSON 已生成: ${outputPath}`);
console.log(`   - 停车位: ${rawData.parkingSpaces.length} 个`);
console.log(`   - 墙体: ${rawData.walls.length} 个`);
console.log(`   - 入口: ${rawData.entrances.length} 个`);
console.log(`   - 电梯: ${rawData.elevators.length} 个`);
console.log(`   - 障碍物: ${rawData.obstacles.length} 个`);
console.log(`   - 交通标志: ${rawData.trafficSigns.length} 个`);

// 导出坐标转换函数供其他脚本使用
module.exports = { canvasToGeo };





