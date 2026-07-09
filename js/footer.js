// =====================================
// FOOTER
// =====================================

// =====================================
// SCALE CONTROL
// =====================================

const scaleLine = new ol.control.ScaleLine({

    units: "metric",

    bar: false,

    text: true,

    minWidth: 100

});

map.addControl(scaleLine);


// =====================================
// VARIABLES
// =====================================

let lastElevationRequest = 0;


// =====================================
// UPDATE FOOTER
// =====================================

map.on("pointermove", function (evt) {

    const lonLat = ol.proj.toLonLat(evt.coordinate);

    const lon = lonLat[0];

    const lat = lonLat[1];

    // LAT

    document.getElementById("latText").textContent =
        lat.toFixed(5);

    // LON

    document.getElementById("lonText").textContent =
        lon.toFixed(5);

    // ZOOM

    document.getElementById("zoomText").textContent =
        map.getView().getZoom().toFixed(1);

    // SCALE

    const resolution =
        map.getView().getResolution();

    const mpu =
        map.getView()
        .getProjection()
        .getMetersPerUnit();

    const scale =
        Math.round(
            resolution *
            mpu *
            39.37 *
            96
        );

    document.getElementById("scaleText").textContent =
        "1 : " +
        scale.toLocaleString();

    // ELEVATION (1 sec throttle)

    const now = Date.now();

    if (now - lastElevationRequest < 1000) return;

    lastElevationRequest = now;

    fetch(

        "https://api.open-elevation.com/api/v1/lookup?locations=" +
        lat +
        "," +
        lon

    )

    .then(r => r.json())

    .then(data => {

        if (

            data.results &&

            data.results.length

        ) {

            document.getElementById("elevationInfo").textContent =

                data.results[0].elevation +

                " m";

        }

    })

    .catch(function () {

        document.getElementById("elevationInfo").textContent =

            "--";

    });

});


// =====================================
// UPDATE ZOOM
// =====================================

map.getView().on(

    "change:resolution",

    function () {

        document.getElementById("zoomText").textContent =

            map.getView()

            .getZoom()

            .toFixed(1);

    }

);