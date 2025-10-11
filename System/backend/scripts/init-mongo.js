db = db.getSiblingDB('parking_admin');

// 创建应用用户
db.createUser({
  user: 'parking_user',
  pwd: 'parking_password',
  roles: [
    {
      role: 'readWrite',
      db: 'parking_admin'
    }
  ]
});

// 创建集合和索引
db.createCollection('users');
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });

db.createCollection('parkinglots');
db.parkinglots.createIndex({ "name": 1 });
db.parkinglots.createIndex({ "isActive": 1 });

db.createCollection('parkingspaces');
db.parkingspaces.createIndex({ "spaceId": 1 }, { unique: true });
db.parkingspaces.createIndex({ "parkingLotId": 1 });
db.parkingspaces.createIndex({ "status": 1 });

db.createCollection('mapnodes');
db.mapnodes.createIndex({ "nodeId": 1 }, { unique: true });
db.mapnodes.createIndex({ "parkingLotId": 1 });

db.createCollection('navigationroutes');
db.navigationroutes.createIndex({ "routeId": 1 }, { unique: true });
db.navigationroutes.createIndex({ "parkingLotId": 1 });

db.createCollection('transactions');
db.transactions.createIndex({ "transactionId": 1 }, { unique: true });
db.transactions.createIndex({ "licensePlate": 1 });
db.transactions.createIndex({ "createdAt": 1 });

db.createCollection('simulationhistories');
db.simulationhistories.createIndex({ "timestamp": 1 });

db.createCollection('systemconfigs');
db.systemconfigs.createIndex({ "key": 1 }, { unique: true });

db.createCollection('systemlogs');
db.systemlogs.createIndex({ "timestamp": 1 });
db.systemlogs.createIndex({ "level": 1 });

print('数据库初始化完成');