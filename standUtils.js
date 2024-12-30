const stands = [
    { name: "Stand A", lat: 23.7806, lon: 90.2794 },
    { name: "Stand B", lat: 23.7594, lon: 90.3784 },
    { name: "Stand C", lat: 23.7505, lon: 90.3934 },
];

function calculateFlatDistance(lat1, lon1, lat2, lon2) {
    const latDiff = (lat2 - lat1) * 111320;
    const lonDiff = (lon2 - lon1) * 111320 * Math.cos((lat1 * Math.PI) / 180);
    return Math.sqrt(latDiff ** 2 + lonDiff ** 2);
}

function findNearestStand(currentLat, currentLon) {
    let nearestStand = null;
    let shortestDistance = Infinity;

    stands.forEach((stand) => {
        const distance = calculateFlatDistance(currentLat, currentLon, stand.lat, stand.lon);
        if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestStand = stand.name;
        }
    });

    return { nearestStand, shortestDistance };
}

module.exports = { findNearestStand };