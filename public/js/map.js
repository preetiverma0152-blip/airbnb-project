function initializeListingMap() {
    const container = document.getElementById("map");
    if (!container) {
        console.error('Mapbox map container "#map" was not found.');
        return;
    }

    if (typeof mapboxgl === "undefined") {
        console.error("Mapbox GL JS did not load. Check the Mapbox script and network request.");
        return;
    }

    if (!mapToken) {
        console.error("Mapbox access token is missing. Check MAP_TOKEN in .env.");
        return;
    }

    const coordinates = listing?.geometry?.coordinates;
    if (
        !Array.isArray(coordinates) ||
        coordinates.length !== 2 ||
        !coordinates.every(Number.isFinite) ||
        coordinates[0] < -180 || coordinates[0] > 180 ||
        coordinates[1] < -90 || coordinates[1] > 90
    ) {
        console.error("Mapbox map was not initialized: listing coordinates must be [longitude, latitude] numeric values.");
        return;
    }

    mapboxgl.accessToken = mapToken;

    try {
        const map = new mapboxgl.Map({
            container,
            style: "mapbox://styles/mapbox/streets-v12",
            center: coordinates,
            zoom: 9,
        });

        map.on("error", (event) => {
            console.error("Mapbox map error:", event.error?.message || event.error);
        });

        new mapboxgl.Marker({ color: "red" })
            .setLngLat(coordinates)
            .setPopup(
                new mapboxgl.Popup({ offset: 25 }).setHTML(
                    `<h4>${listing.location}</h4><p>Exact location provided after booking</p>`
                )
            )
            .addTo(map);
    } catch (error) {
        console.error("Mapbox map initialization failed:", error.message);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeListingMap, { once: true });
} else {
    initializeListingMap();
}
