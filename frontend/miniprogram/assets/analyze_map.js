const mapData = require('./map_elements.js');
let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
let spotCount = 0;
let spots = [];

mapData.features.forEach(f => {
    if (f.properties.type === 'parking_spot') {
        spotCount++;
        const coords = f.geometry.coordinates[0];
        let cx = 0, cy = 0;
        coords.forEach(c => {
            const lng = c[0];
            const lat = c[1];
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
            cx += lng;
            cy += lat;
        });
        spots.push({
            id: f.properties.id,
            cx: cx / coords.length,
            cy: cy / coords.length
        });
    }
});

console.log(JSON.stringify({
    spotCount,
    minLng, maxLng, minLat, maxLat,
    width: maxLng - minLng,
    height: maxLat - minLat,
    spotsSample: spots.slice(0, 5)
}, null, 2));
