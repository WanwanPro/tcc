const fs = require('fs');

// 读取原始数据文件
const data = JSON.parse(fs.readFileSync('./tcc1date1.json', 'utf8'));

// 统计车位数量
const parkingSpacesCount = data.parkingSpaces.length;
console.log(`原始数据文件中的车位总数: ${parkingSpacesCount}`);

// 按位置分组统计
const areas = {
  'A区': 0,  // 假设前55个是A区
  'B区': 0   // 剩余的是B区
};

data.parkingSpaces.forEach((space, index) => {
  if (index < 55) {
    areas['A区']++;
  } else {
    areas['B区']++;
  }
});

console.log('各区域车位数量:');
console.log(`A区: ${areas['A区']}个车位`);
console.log(`B区: ${areas['B区']}个车位`);