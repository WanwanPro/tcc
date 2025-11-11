/**
 * 将 GeoJSON 文件转换为 JS 模块
 */

const fs = require('fs');
const path = require('path');

// 读取 GeoJSON 文件
const geojsonPath = path.join(__dirname, '../frontend/miniprogram/assets/map_elements.geojson');
const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

// 转换为 JS 模块
const jsContent = `// 自动生成的 GeoJSON 数据
// 不要手动修改此文件

module.exports = ${JSON.stringify(geojson, null, 2)};
`;

// 写入 JS 文件
const jsPath = path.join(__dirname, '../frontend/miniprogram/assets/map_elements.js');
fs.writeFileSync(jsPath, jsContent);

console.log(`✅ GeoJSON 已转换为 JS 模块: ${jsPath}`);
console.log(`   - 特征数: ${geojson.features.length}`);




