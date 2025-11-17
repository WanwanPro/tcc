const mongoose = require('mongoose');
const ParkingLot = require('./models/ParkingLot');
const ParkingSpace = require('./models/ParkingSpace');
const MapNode = require('./models/MapNode');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/parking_admin', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// 读取 TCC1 数据
const fs = require('fs');
const tcc1Data = JSON.parse(fs.readFileSync('./tcc1date1.json', 'utf8'));

async function importTCC1Data() {
    try {
        console.log('开始导入 TCC1 停车场数据...');
        
        // 1. 创建 TCC1 停车场
        let tcc1Lot = await ParkingLot.findOne({ name: 'TCC1停车场' });
        if (!tcc1Lot) {
            tcc1Lot = new ParkingLot({
                name: 'TCC1停车场',
                address: '测试地址',
                totalSpaces: 0,
                floors: [{
                    floorId: 'TCC1-F1',
                    floorName: '一楼',
                    spaces: [],
                    mapImage: '',
                    nodes: []
                }],
                operatingHours: {
                    open: '00:00',
                    close: '23:59'
                },
                status: 'active',
                facilities: ['24小时监控', '电动汽车充电桩', '无障碍停车位'],
                contact: {
                    phone: '123456789',
                    email: 'test@example.com'
                }
            });
            
            await tcc1Lot.save();
            console.log('已创建 TCC1 停车场');
        } else {
            console.log(`找到 TCC1 停车场: ${tcc1Lot.name}`);
        }
        
        // 2. 删除 TCC1 停车场的所有现有停车位和地图节点
        await ParkingSpace.deleteMany({ lotId: tcc1Lot._id });
        await MapNode.deleteMany({ lotId: tcc1Lot._id });
        console.log('已清除 TCC1 停车场的现有数据');
        
        // 3. 导入停车位数据
        const spaces = [];
        for (let i = 0; i < tcc1Data.parkingSpaces.length && i < 160; i++) {
            const space = tcc1Data.parkingSpaces[i];
            
            // 创建停车位对象，使用1-160作为车位号
            const parkingSpace = new ParkingSpace({
                spaceId: (i + 1).toString(), // 使用1-160作为车位号，转为字符串
                floorId: 'TCC1-F1', // 楼层ID
                lotId: tcc1Lot._id, // 停车场ID
                area: 'A区', // 区域
                type: 'standard', // 默认标准车位
                status: Math.random() > 0.6 ? 'occupied' : 'available', // 随机设置占用状态，约40%占用率
                position: {
                    x: space.x,
                    y: space.y
                }
            });
            
            const savedSpace = await parkingSpace.save();
            spaces.push(savedSpace);
            
            // 为每个停车位创建地图节点
            const mapNode = new MapNode({
                nodeId: `space-${i + 1}`,
                floorId: 'TCC1-F1', // 楼层ID
                lotId: tcc1Lot._id, // 停车场ID
                type: 'parking', // 停车位节点
                position: {
                    x: space.x + space.width / 2, // 使用停车位中心点
                    y: space.y + space.height / 2
                },
                name: `车位 ${i + 1}`,
                description: '停车位'
            });
            
            await mapNode.save();
        }
        
        console.log(`已导入 ${spaces.length} 个停车位`);
        
        // 4. 导入入口数据
        for (const entrance of tcc1Data.entrances) {
            const mapNode = new MapNode({
                nodeId: `entrance-${entrance.id}`,
                floorId: 'TCC1-F1', // 楼层ID
                lotId: tcc1Lot._id, // 停车场ID
                type: 'entrance', // 入口节点
                position: {
                    x: entrance.x + entrance.width / 2, // 使用入口中心点
                    y: entrance.y + entrance.height / 2
                },
                name: `入口 ${entrance.id}`,
                description: '停车场入口'
            });
            
            await mapNode.save();
        }
        
        console.log(`已导入 ${tcc1Data.entrances.length} 个入口`);
        
        // 5. 导入电梯数据
        for (const elevator of tcc1Data.elevators) {
            const mapNode = new MapNode({
                nodeId: `elevator-${elevator.id}`,
                floorId: 'TCC1-F1', // 楼层ID
                lotId: tcc1Lot._id, // 停车场ID
                type: 'elevator', // 电梯节点
                position: {
                    x: elevator.x + elevator.width / 2, // 使用电梯中心点
                    y: elevator.y + elevator.height / 2
                },
                name: `电梯 ${elevator.id}`,
                description: '电梯'
            });
            
            await mapNode.save();
        }
        
        console.log(`已导入 ${tcc1Data.elevators.length} 个电梯`);
        
        // 6. 更新停车场信息
        tcc1Lot.totalSpaces = spaces.length;
        tcc1Lot.availableSpaces = spaces.filter(s => s.status === 'available').length;
        tcc1Lot.occupiedSpaces = spaces.filter(s => s.status === 'occupied').length;
        tcc1Lot.occupancyRate = (tcc1Lot.occupiedSpaces / tcc1Lot.totalSpaces * 100).toFixed(2);
        
        await tcc1Lot.save();
        
        console.log('TCC1 停车场数据导入完成!');
        console.log(`总停车位: ${tcc1Lot.totalSpaces}`);
        console.log(`已占用: ${tcc1Lot.occupiedSpaces}`);
        console.log(`可用: ${tcc1Lot.availableSpaces}`);
        console.log(`占用率: ${tcc1Lot.occupancyRate}%`);
        
    } catch (error) {
        console.error('导入 TCC1 数据时出错:', error);
    } finally {
        mongoose.disconnect();
    }
}

// 执行导入
importTCC1Data();