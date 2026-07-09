// =====================================
// SEARCH LOCATION
// =====================================

async function searchLocation() {

    const input =

        document
        .getElementById("searchBox")
        .value
        .trim();

    if (!input) return;

    searchSource.clear();

    // =====================================
    // LAT,LON SEARCH
    // =====================================

    if (input.includes(",")) {

        const parts = input.split(",");

        if (parts.length === 2) {

            const lat = parseFloat(parts[0]);

            const lon = parseFloat(parts[1]);

            if (

                !isNaN(lat) &&
                !isNaN(lon) &&
                lat >= -90 &&
                lat <= 90 &&
                lon >= -180 &&
                lon <= 180

            ) {

                zoomToLocation(lon, lat, 15);

                return;

            }

        }

    }

    // =====================================
    // PLACE SEARCH
    // =====================================

    try {

        const response = await fetch(

            "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +

            encodeURIComponent(input)

        );

        const data = await response.json();

        if (!data.length) {

            alert("Location not found");

            return;

        }

        zoomToLocation(

            parseFloat(data[0].lon),

            parseFloat(data[0].lat),

            12

        );

    }

    catch (e) {

        alert("Location not found");

    }

}


// =====================================
// ZOOM TO LOCATION
// =====================================

function zoomToLocation(lon, lat, zoom) {

    const coord =

        ol.proj.fromLonLat([lon, lat]);

    searchSource.addFeature(

        new ol.Feature({

            geometry:

                new ol.geom.Point(coord)

        })

    );

    view.setCenter(coord);

    view.setZoom(zoom);

}


// =====================================
// ENTER KEY
// =====================================

document

.getElementById("searchBox")

.addEventListener(

    "keydown",

    function (e) {

        if (e.key === "Enter") {

            searchLocation();

        }

    }

);