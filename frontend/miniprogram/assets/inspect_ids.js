const mapData = require('./map_elements.js');
const spots = mapData.features.filter(f => f.properties.type === 'parking_spot');
console.log("Total spots:", spots.length);
console.log("Sample IDs:", spots.slice(0, 5).map(f => f.properties.id));
// Check if there are other properties that might hold the "TCC1-xxx" label
console.log("Sample Properties:", JSON.stringify(spots[0].properties, null, 2));
