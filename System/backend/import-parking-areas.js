const mongoose = require('mongoose');
const fs = require('fs');
const ParkingSpace = require('./models/ParkingSpace');
const ParkingLot = require('./models/ParkingLot');
const MapNode = require('./models/MapNode');

// 连接数据库
mongoose.connect('mongodb://192.168.0.78:27017/parking_admin', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('已连接到数据库');
    
    try {
        // 查找TCC1停车场
        let tcc1Lot = await ParkingLot.findOne({ name: 'TCC1停车场' });
        
        if (!tcc1Lot) {
            // 如果不存在，创建TCC1停车场
            tcc1Lot = new ParkingLot({
                name: 'TCC1停车场',
                location: 'TCC1大楼',
                totalSpaces: 0,
                availableSpaces: 0,
                floors: ['TCC1-F1']
            });
            await tcc1Lot.save();
            console.log('已创建TCC1停车场');
        } else {
            console.log('找到TCC1停车场:', tcc1Lot.name);
        }
        
        // 清除现有数据
        await ParkingSpace.deleteMany({ lotId: tcc1Lot._id });
        await MapNode.deleteMany({ lotId: tcc1Lot._id });
        console.log('已清除TCC1停车场的现有数据');
        
        // 读取车位数据
        const parkingData = JSON.parse(fs.readFileSync('tcc1date1.json', 'utf8'));
        const parkingSpaces = parkingData.parkingSpaces;
        
        // 只取前160个车位
        const selectedSpaces = parkingSpaces.slice(0, 160);
        
        // 按Y坐标将车位分为A、B、C三个区域
        let aCount = 0;
        let bCount = 0;
        let cCount = 0;
        let totalSpaces = 0;
        let occupiedSpaces = 0;
        
        for (let i = 0; i < selectedSpaces.length; i++) {
            const space = selectedSpaces[i];
            let area;
            
            // 根据Y坐标确定区域
            if (space.y < 200) {
                area = 'A区';
                aCount++;
            } else if (space.y < 400) {
                area = 'B区';
                bCount++;
            } else {
                area = 'C区';
                cCount++;
            }
            
            // 创建停车位对象，使用1-160作为车位号
            const parkingSpace = new ParkingSpace({
                spaceId: (i + 1).toString(), // 使用1-160作为车位号，转为字符串
                floorId: 'TCC1-F1', // 楼层ID
                lotId: tcc1Lot._id, // 停车场ID
                area: area, // 根据Y坐标确定区域
                type: 'standard', // 默认标准车位
                status: Math.random() > 0.6 ? 'occupied' : 'available', // 随机设置占用状态，约40%占用率
                position: {
                    x: space.x,
                    y: space.y
                }
            });
            
            await parkingSpace.save();
            totalSpaces++;
            if (parkingSpace.status === 'occupied') {
                occupiedSpaces++;
            }
            
            // 为每个车位创建地图节点
            const mapNode = new MapNode({
                nodeId: `PS-${i + 1}`, // 车位节点ID
                name: `车位 ${i + 1}`, // 车位名称
                type: 'parking', // 节点类型
                floorId: 'TCC1-F1', // 楼层ID
                lotId: tcc1Lot._id, // 停车场ID
                position: {
                    x: space.x,
                    y: space.y
                },
                connections: [] // 初始无连接
            });
            
            await mapNode.save();
        }
        
        // 创建入口节点
        const entrance1 = new MapNode({
            nodeId: 'ENTRANCE-1',
            name: '入口1',
            type: 'entrance',
            floorId: 'TCC1-F1',
            lotId: tcc1Lot._id,
            position: { x: 50, y: 50 },
            connections: []
        });
        await entrance1.save();
        
        const entrance2 = new MapNode({
            nodeId: 'ENTRANCE-2',
            name: '入口2',
            type: 'entrance',
            floorId: 'TCC1-F1',
            lotId: tcc1Lot._id,
            position: { x: 100, y: 50 },
            connections: []
        });
        await entrance2.save();
        
        // 创建电梯节点
        const elevator = new MapNode({
            nodeId: 'ELEVATOR-1',
            name: '电梯',
            type: 'elevator',
            floorId: 'TCC1-F1',
            lotId: tcc1Lot._id,
            position: { x: 150, y: 50 },
            connections: []
        });
        await elevator.save();
        
        // 更新停车场统计信息
        tcc1Lot.totalSpaces = totalSpaces;
        tcc1Lot.availableSpaces = totalSpaces - occupiedSpaces;
        await tcc1Lot.save();
        
        console.log('TCC1停车场数据导入完成!');
        console.log('总停车位:', totalSpaces);
        console.log('A区车位:', aCount);
        console.log('B区车位:', bCount);
        console.log('C区车位:', cCount);
        console.log('已占用:', occupiedSpaces);
        console.log('可用:', totalSpaces - occupiedSpaces);
        console.log('占用率:', ((occupiedSpaces / totalSpaces) * 100).toFixed(2) + '%');
        
        // 删除A区1-55号车位
        const aSpacesToDelete = await ParkingSpace.find({
            area: 'A区',
            spaceId: { $lte: '55' }
        });
        
        for (const space of aSpacesToDelete) {
            // 删除对应的地图节点
            await MapNode.deleteMany({
                lotId: tcc1Lot._id,
                name: `车位 ${space.spaceId}`
            });
            
            // 删除车位
            await ParkingSpace.deleteOne({ _id: space._id });
            totalSpaces--;
            if (space.status === 'occupied') {
                occupiedSpaces--;
            }
        }
        
        // 删除C区所有车位
        const cSpacesToDelete = await ParkingSpace.find({
            area: 'C区'
        });
        
        for (const space of cSpacesToDelete) {
            // 删除对应的地图节点
            await MapNode.deleteMany({
                lotId: tcc1Lot._id,
                name: `车位 ${space.spaceId}`
            });
            
            // 删除车位
            await ParkingSpace.deleteOne({ _id: space._id });
            totalSpaces--;
            if (space.status === 'occupied') {
                occupiedSpaces--;
            }
        }
        
        // 更新停车场统计信息
        tcc1Lot.totalSpaces = totalSpaces;
        tcc1Lot.availableSpaces = totalSpaces - occupiedSpaces;
        await tcc1Lot.save();
        
        console.log('\\n删除A区1-55号和C区车位后:');
        console.log('总停车位:', totalSpaces);
        console.log('已占用:', occupiedSpaces);
        console.log('可用:', totalSpaces - occupiedSpaces);
        console.log('占用率:', ((occupiedSpaces / totalSpaces) * 100).toFixed(2) + '%');
        
        // 检查B区车位
        const bSpaces = await ParkingSpace.find({
            area: 'B区'
        });
        
        console.log('\\nB区车位数量:', bSpaces.length);
        console.log('B区车位示例:');
        bSpaces.slice(0, 5).forEach(space => {
            console.log('spaceId:', space.spaceId, ', area:', space.area);
        });
        
    } catch (error) {
        console.error('导入数据时出错:', error);
    } finally {
        mongoose.connection.close();
    }
}).catch(err => {
    console.error('连接数据库失败:', err);
});