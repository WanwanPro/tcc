/**
 * 将导航图 JSON 文件转换为 JS 模块
 */

const fs = require('fs');
const path = require('path');

// 读取导航图文件
const navGraphPath = path.join(__dirname, '../frontend/miniprogram/assets/navigation_graph.json');
const navGraph = JSON.parse(fs.readFileSync(navGraphPath, 'utf8'));

// 转换为 JS 模块
const jsContent = `// 自动生成的导航图数据
// 不要手动修改此文件

module.exports = ${JSON.stringify(navGraph, null, 2)};
`;

// 写入 JS 文件
const jsPath = path.join(__dirname, '../frontend/miniprogram/assets/navigation_graph.js');
fs.writeFileSync(jsPath, jsContent);

console.log(`✅ 导航图已转换为 JS 模块: ${jsPath}`);
console.log(`   - 节点数: ${navGraph.nodes.length}`);
console.log(`   - 边数: ${navGraph.edges.length}`);




