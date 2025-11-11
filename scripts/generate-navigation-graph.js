/**
 * 生成导航图（节点和边）
 * 基于停车场的车道结构自动生成导航节点
 */

const fs = require('fs');
const path = require('path');
const { canvasToGeo } = require('./convert-to-geojson');

// 手动定义主要车道节点（根据 tcc1date1.json 的布局）
// 这些节点应该沿着车道中心线分布
const nodes = [
  // 入口区域节点
  { id: 'node-001', x: 165, y: 225, name: '入口1' },
  
  // 顶部横向车道节点
  { id: 'node-002', x: 250, y: 225 },
  { id: 'node-003', x: 450, y: 225 },
  { id: 'node-004', x: 650, y: 225 },
  { id: 'node-005', x: 850, y: 225 },
  { id: 'node-006', x: 1050, y: 225 },
  { id: 'node-007', x: 1250, y: 225 },
  { id: 'node-008', x: 1450, y: 225 },
  { id: 'node-009', x: 1650, y: 225 },
  { id: 'node-010', x: 1850, y: 225 },
  { id: 'node-011', x: 2050, y: 225 },
  { id: 'node-012', x: 2180, y: 225 },
  
  // 右侧纵向车道节点
  { id: 'node-013', x: 2180, y: 350 },
  { id: 'node-014', x: 2180, y: 450 },
  { id: 'node-015', x: 2180, y: 550 },
  { id: 'node-016', x: 2180, y: 650 },
  { id: 'node-017', x: 2180, y: 750 },
  { id: 'node-018', x: 2180, y: 850, name: '出口' },
  
  // 底部横向车道节点
  { id: 'node-019', x: 2000, y: 700 },
  { id: 'node-020', x: 1800, y: 700 },
  { id: 'node-021', x: 1600, y: 700 },
  { id: 'node-022', x: 1400, y: 700 },
  { id: 'node-023', x: 1200, y: 700 },
  { id: 'node-024', x: 1000, y: 700 },
  { id: 'node-025', x: 800, y: 700 },
  { id: 'node-026', x: 600, y: 700 },
  { id: 'node-027', x: 400, y: 700 },
  { id: 'node-028', x: 300, y: 700 },
  
  // 左侧纵向车道节点
  { id: 'node-029', x: 250, y: 600 },
  { id: 'node-030', x: 250, y: 500 },
  { id: 'node-031', x: 250, y: 400 },
  { id: 'node-032', x: 250, y: 325 },
  
  // 中间横向车道节点（连接上下车道）
  { id: 'node-033', x: 450, y: 420 },
  { id: 'node-034', x: 650, y: 420 },
  { id: 'node-035', x: 850, y: 420 },
  { id: 'node-036', x: 1050, y: 420 },
  { id: 'node-037', x: 1250, y: 420 },
  { id: 'node-038', x: 1450, y: 420 },
  { id: 'node-039', x: 1650, y: 420 },
  { id: 'node-040', x: 1850, y: 420 },
  
  // 电梯节点
  { id: 'node-041', x: 1345, y: 590, name: '电梯' },
  
  // 连接纵向车道节点
  { id: 'node-042', x: 450, y: 600 },
  { id: 'node-043', x: 650, y: 600 },
  { id: 'node-044', x: 850, y: 600 },
  { id: 'node-045', x: 1050, y: 600 },
  { id: 'node-046', x: 1650, y: 600 },
  { id: 'node-047', x: 1850, y: 600 }
];

// 定义边（连接）
const edges = [
  // 顶部横向车道（双向）
  { from: 'node-001', to: 'node-002', oneway: false },
  { from: 'node-002', to: 'node-003', oneway: false },
  { from: 'node-003', to: 'node-004', oneway: false },
  { from: 'node-004', to: 'node-005', oneway: false },
  { from: 'node-005', to: 'node-006', oneway: false },
  { from: 'node-006', to: 'node-007', oneway: false },
  { from: 'node-007', to: 'node-008', oneway: false },
  { from: 'node-008', to: 'node-009', oneway: false },
  { from: 'node-009', to: 'node-010', oneway: false },
  { from: 'node-010', to: 'node-011', oneway: false },
  { from: 'node-011', to: 'node-012', oneway: false },
  
  // 右侧纵向车道（双向）
  { from: 'node-012', to: 'node-013', oneway: false },
  { from: 'node-013', to: 'node-014', oneway: false },
  { from: 'node-014', to: 'node-015', oneway: false },
  { from: 'node-015', to: 'node-016', oneway: false },
  { from: 'node-016', to: 'node-017', oneway: false },
  { from: 'node-017', to: 'node-018', oneway: false },
  
  // 底部横向车道（双向）
  { from: 'node-016', to: 'node-019', oneway: false },
  { from: 'node-019', to: 'node-020', oneway: false },
  { from: 'node-020', to: 'node-021', oneway: false },
  { from: 'node-021', to: 'node-022', oneway: false },
  { from: 'node-022', to: 'node-023', oneway: false },
  { from: 'node-023', to: 'node-024', oneway: false },
  { from: 'node-024', to: 'node-025', oneway: false },
  { from: 'node-025', to: 'node-026', oneway: false },
  { from: 'node-026', to: 'node-027', oneway: false },
  { from: 'node-027', to: 'node-028', oneway: false },
  
  // 左侧纵向车道（双向）
  { from: 'node-028', to: 'node-029', oneway: false },
  { from: 'node-029', to: 'node-030', oneway: false },
  { from: 'node-030', to: 'node-031', oneway: false },
  { from: 'node-031', to: 'node-032', oneway: false },
  { from: 'node-032', to: 'node-002', oneway: false },
  
  // 中间横向连接（双向）
  { from: 'node-003', to: 'node-033', oneway: false },
  { from: 'node-004', to: 'node-034', oneway: false },
  { from: 'node-005', to: 'node-035', oneway: false },
  { from: 'node-006', to: 'node-036', oneway: false },
  { from: 'node-007', to: 'node-037', oneway: false },
  { from: 'node-008', to: 'node-038', oneway: false },
  { from: 'node-009', to: 'node-039', oneway: false },
  { from: 'node-010', to: 'node-040', oneway: false },
  
  { from: 'node-033', to: 'node-042', oneway: false },
  { from: 'node-034', to: 'node-043', oneway: false },
  { from: 'node-035', to: 'node-044', oneway: false },
  { from: 'node-036', to: 'node-045', oneway: false },
  { from: 'node-039', to: 'node-046', oneway: false },
  { from: 'node-040', to: 'node-047', oneway: false },
  
  { from: 'node-042', to: 'node-027', oneway: false },
  { from: 'node-043', to: 'node-026', oneway: false },
  { from: 'node-044', to: 'node-025', oneway: false },
  { from: 'node-045', to: 'node-024', oneway: false },
  { from: 'node-046', to: 'node-021', oneway: false },
  { from: 'node-047', to: 'node-020', oneway: false },
  
  // 电梯连接
  { from: 'node-023', to: 'node-041', oneway: false },
  { from: 'node-041', to: 'node-037', oneway: false }
];

// 转换节点为地理坐标
const geoNodes = nodes.map(node => ({
  ...node,
  coordinates: canvasToGeo(node.x, node.y)
}));

// 构建导航图
const navigationGraph = {
  nodes: geoNodes,
  edges: edges
};

// 保存导航图
const outputPath = path.join(__dirname, '../frontend/miniprogram/assets/navigation_graph.json');
fs.writeFileSync(outputPath, JSON.stringify(navigationGraph, null, 2));

console.log(`✅ 导航图已生成: ${outputPath}`);
console.log(`   - 节点数: ${nodes.length}`);
console.log(`   - 边数: ${edges.length}`);

module.exports = navigationGraph;




