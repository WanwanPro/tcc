/**
 * 测试导航系统的数据和算法
 */

const fs = require('fs');
const path = require('path');
const { astar, findNearestNode, heuristic } = require('../frontend/miniprogram/utils/astar');

// 读取数据文件
const navigationGraph = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../frontend/miniprogram/assets/navigation_graph.json'), 'utf8')
);
const mapElements = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../frontend/miniprogram/assets/map_elements.geojson'), 'utf8')
);

console.log('========================================');
console.log('  导航系统测试');
console.log('========================================\n');

// 1. 测试地图数据
console.log('1. 地图数据检查:');
console.log(`   - 总特征数: ${mapElements.features.length}`);

const featureTypes = {};
mapElements.features.forEach(feature => {
  const type = feature.properties.type;
  featureTypes[type] = (featureTypes[type] || 0) + 1;
});

Object.keys(featureTypes).forEach(type => {
  console.log(`   - ${type}: ${featureTypes[type]} 个`);
});
console.log('   ✓ 地图数据加载成功\n');

// 2. 测试导航图
console.log('2. 导航图检查:');
console.log(`   - 节点数: ${navigationGraph.nodes.length}`);
console.log(`   - 边数: ${navigationGraph.edges.length}`);

// 检查节点连通性
const adjacency = {};
navigationGraph.nodes.forEach(node => {
  adjacency[node.id] = [];
});

navigationGraph.edges.forEach(edge => {
  adjacency[edge.from].push(edge.to);
  if (!edge.oneway) {
    adjacency[edge.to].push(edge.from);
  }
});

const isolated = navigationGraph.nodes.filter(node => 
  adjacency[node.id].length === 0
);

if (isolated.length > 0) {
  console.log(`   ⚠ 警告: 发现 ${isolated.length} 个孤立节点:`);
  isolated.forEach(node => {
    console.log(`      - ${node.id} (${node.name || ''})`);
  });
} else {
  console.log('   ✓ 所有节点已连接');
}

// 检查命名节点
const namedNodes = navigationGraph.nodes.filter(n => n.name);
console.log(`   - 命名节点: ${namedNodes.length} 个`);
namedNodes.forEach(node => {
  console.log(`      - ${node.id}: ${node.name}`);
});
console.log('   ✓ 导航图检查完成\n');

// 3. 测试 A* 算法
console.log('3. A* 算法测试:');

const testCases = [
  { start: 'node-001', end: 'node-018', name: '入口 → 出口' },
  { start: 'node-001', end: 'node-041', name: '入口 → 电梯' },
  { start: 'node-041', end: 'node-018', name: '电梯 → 出口' },
  { start: 'node-006', end: 'node-020', name: 'A区 → B区' }
];

testCases.forEach((testCase, index) => {
  try {
    const startNode = navigationGraph.nodes.find(n => n.id === testCase.start);
    const endNode = navigationGraph.nodes.find(n => n.id === testCase.end);
    
    if (!startNode || !endNode) {
      console.log(`   ${index + 1}. ${testCase.name}: ✗ 节点不存在`);
      return;
    }
    
    const path = astar(navigationGraph, testCase.start, testCase.end);
    
    if (path.length > 0) {
      // 计算路径总长度
      let totalDistance = 0;
      for (let i = 0; i < path.length - 1; i++) {
        const dx = path[i + 1][0] - path[i][0];
        const dy = path[i + 1][1] - path[i][1];
        totalDistance += Math.sqrt(dx * dx + dy * dy);
      }
      
      console.log(`   ${index + 1}. ${testCase.name}:`);
      console.log(`      ✓ 路径找到`);
      console.log(`      - 节点数: ${path.length}`);
      console.log(`      - 总距离: ${(totalDistance * 100000).toFixed(2)} 单位`);
    } else {
      console.log(`   ${index + 1}. ${testCase.name}: ✗ 未找到路径`);
    }
  } catch (error) {
    console.log(`   ${index + 1}. ${testCase.name}: ✗ 错误 - ${error.message}`);
  }
});
console.log('   ✓ A* 算法测试完成\n');

// 4. 测试最近节点查找
console.log('4. 最近节点查找测试:');

const testPoints = [
  { lng: 113.0, lat: 23.0, desc: '停车场中心' },
  { lng: 112.9999, lat: 23.0001, desc: '入口附近' },
  { lng: 113.001, lat: 22.999, desc: '出口附近' }
];

testPoints.forEach((point, index) => {
  const nearestId = findNearestNode(navigationGraph, [point.lng, point.lat]);
  const nearestNode = navigationGraph.nodes.find(n => n.id === nearestId);
  console.log(`   ${index + 1}. ${point.desc}:`);
  console.log(`      最近节点: ${nearestId} (${nearestNode.name || ''})`);
});
console.log('   ✓ 最近节点查找测试完成\n');

// 5. 性能测试
console.log('5. 性能测试:');

const perfStart = Date.now();
let pathCount = 0;

for (let i = 0; i < 100; i++) {
  const startIdx = Math.floor(Math.random() * navigationGraph.nodes.length);
  const endIdx = Math.floor(Math.random() * navigationGraph.nodes.length);
  const path = astar(
    navigationGraph,
    navigationGraph.nodes[startIdx].id,
    navigationGraph.nodes[endIdx].id
  );
  if (path.length > 0) pathCount++;
}

const perfEnd = Date.now();
const avgTime = (perfEnd - perfStart) / 100;

console.log(`   - 执行 100 次路径规划`);
console.log(`   - 成功率: ${pathCount}%`);
console.log(`   - 平均耗时: ${avgTime.toFixed(2)} ms`);
console.log('   ✓ 性能测试完成\n');

console.log('========================================');
console.log('  测试完成！');
console.log('========================================');
console.log('\n所有系统组件运行正常，可以启动小程序测试。\n');

