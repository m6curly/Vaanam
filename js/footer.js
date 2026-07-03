// =====================================
// FOOTER COORDINATES + ELEVATION + SCALE
// =====================================

// last elevation request time
let lastElevationRequest = 0;

// scale element
const scaleLine = new ol.control.ScaleLine({

    units: 'metric',
    bar: false,
    text: true,
    minWidth: 100

});

// map me scale add karo
map.addControl(scaleLine);


// =====================================
// POINTER MOVE
// =====================================

map.on(

    "pointermove",

    function(evt){

        // --------------------------------
        // projection conversion
        // --------------------------------

        const coord = ol.proj.toLonLat(
            evt.coordinate
        );

        const lon = coord[0];
        const lat = coord[1];

        // --------------------------------
        // latitude
        // --------------------------------

        const latElement =
            document.getElementById(
                "latText"
            );

        if(latElement){

            latElement.innerHTML =
                lat.toFixed(5);

        }

        // --------------------------------
        // longitude
        // --------------------------------

        const lonElement =
            document.getElementById(
                "lonText"
            );

        if(lonElement){

            lonElement.innerHTML =
                lon.toFixed(5);

        }

        // --------------------------------
        // zoom level
        // --------------------------------

        const zoomElement =
            document.getElementById(
                "zoomText"
            );

        if(zoomElement){

            zoomElement.innerHTML =
                map
                .getView()
                .getZoom()
                .toFixed(1);

        }

        // --------------------------------
        // scale
        // --------------------------------

        const scaleElement =
            document.getElementById(
                "scaleText"
            );

        if(scaleElement){

            const resolution =
                map
                .getView()
                .getResolution();

            const projection =
                map
                .getView()
                .getProjection();

            const mpu =
                projection
                .getMetersPerUnit();

            const scale =
                Math.round(
                    resolution *
                    mpu *
                    39.37 *
                    96
                );

            scaleElement.innerHTML =
                "1 : "
                +
                scale.toLocaleString();

        }

        // --------------------------------
        // elevation request throttle
        // --------------------------------

        const now =
            Date.now();

        if(
            now -
            lastElevationRequest
            < 1000
        ){
            return;
        }

        lastElevationRequest =
            now;

        // --------------------------------
        // elevation API
        // --------------------------------

        fetch(

            "https://api.open-elevation.com/api/v1/lookup?locations="
            +
            lat
            +
            ","
            +
            lon

        )

        .then(

            response =>
                response.json()

        )

        .then(

            data => {

                const elevElement =
                    document.getElementById(
                        "elevationInfo"
                    );

                if(
                    elevElement &&
                    data.results &&
                    data.results.length > 0
                ){

                    elevElement.innerHTML =
                        data.results[0]
                        .elevation
                        +
                        " m";

                }

            }

        )

        .catch(

            function(){

                const elevElement =
                    document.getElementById(
                        "elevationInfo"
                    );

                if(elevElement){

                    elevElement.innerHTML =
                        "--";

                }

            }

        );

    }

);


// =====================================
// ZOOM CHANGE EVENT
// =====================================

map.getView().on(

    "change:resolution",

    function(){

        const zoomElement =
            document.getElementById(
                "zoomText"
            );

        if(zoomElement){

            zoomElement.innerHTML =
                map
                .getView()
                .getZoom()
                .toFixed(1);

        }

    }

);