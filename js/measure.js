// =====================================
// MEASURE VARIABLES
// =====================================

let measureSource =
    new ol.source.Vector();

let measureLayer =
    new ol.layer.Vector({

        source: measureSource,

        style: new ol.style.Style({

            stroke:
            new ol.style.Stroke({

                color:"#ff0000",
                width:2

            }),

            fill:
            new ol.style.Fill({

                color:
                "rgba(255,0,0,0.2)"

            }),

            image:
            new ol.style.Circle({

                radius:5,

                fill:
                new ol.style.Fill({

                    color:"#ff0000"

                })

            })

        })

    });

map.addLayer(
    measureLayer
);

let measureInteraction = null;

// =====================================
// MEASURE PANEL OPEN/CLOSE
// =====================================

document.addEventListener(

    "DOMContentLoaded",

    function(){

        const btn =
            document.getElementById(
                "measureBtn"
            );

        const panel =
            document.getElementById(
                "measurePanel"
            );

        btn.onclick =
        function(){

            panel.style.display =
            panel.style.display ===
            "block"
            ? "none"
            : "block";

        };

    }

);

// =====================================
// REMOVE MEASURE
// =====================================

function removeMeasure(){

    if(measureInteraction){

        map.removeInteraction(
            measureInteraction
        );

        measureInteraction = null;
    }

}

// =====================================
// MEASURE DISTANCE
// =====================================

document
.getElementById(
    "measureDistance"
)
.onclick=function(){

    removeMeasure();

    measureInteraction =

        new ol.interaction.Draw({

            source:
                measureSource,

            type:
                "LineString"

        });

    map.addInteraction(
        measureInteraction
    );

    measureInteraction.on(

        "drawend",

        function(e){

            const length =

                ol.sphere.getLength(
                    e.feature
                    .getGeometry()
                );

            alert(

                "Distance = " +

                (length/1000)
                .toFixed(2)

                +

                " km"

            );

            removeMeasure();

        }

    );

};

// =====================================
// MEASURE AREA
// =====================================

document
.getElementById(
    "measureArea"
)
.onclick=function(){

    removeMeasure();

    measureInteraction =

        new ol.interaction.Draw({

            source:
                measureSource,

            type:
                "Polygon"

        });

    map.addInteraction(
        measureInteraction
    );

    measureInteraction.on(

        "drawend",

        function(e){

            const geom =
                e.feature
                .getGeometry();

            const area =
                ol.sphere.getArea(
                    geom
                );

            if(area > 1000000){

                alert(

                    "Area = "
                    +
                    (area/1000000)
                    .toFixed(2)
                    +
                    " km²"

                );

            }
            else{

                alert(

                    "Area = "
                    +
                    area
                    .toFixed(2)
                    +
                    " m²"

                );

            }

            removeMeasure();

        }

    );

};

// =====================================
// MEASURE RADIUS
// =====================================

document
.getElementById(
    "measureRadius"
)
.onclick=function(){

    removeMeasure();

    measureInteraction =

        new ol.interaction.Draw({

            source:
                measureSource,

            type:
                "Circle"

        });

    map.addInteraction(
        measureInteraction
    );

    measureInteraction.on(

        "drawend",

        function(e){

            const radius =

                e.feature
                .getGeometry()
                .getRadius();

            alert(

                "Radius = " +

                (radius/1000)
                .toFixed(2)

                +

                " km"

            );

            removeMeasure();

        }

    );

};

// =====================================
// MEASURE PERIMETER
// =====================================

document
.getElementById(
    "measurePerimeter"
)
.onclick=function(){

    removeMeasure();

    measureInteraction =

        new ol.interaction.Draw({

            source:
                measureSource,

            type:
                "Polygon"

        });

    map.addInteraction(
        measureInteraction
    );

    measureInteraction.on(

        "drawend",

        function(e){

            const coords =

                e.feature
                .getGeometry()
                .getCoordinates()[0];

            const line =

                new ol.geom.LineString(
                    coords
                );

            const length =

                ol.sphere.getLength(
                    line
                );

            alert(

                "Perimeter = " +

                (length/1000)
                .toFixed(2)

                +

                " km"

            );

            removeMeasure();

        }

    );

};

// =====================================
// COORDINATE
// =====================================

document
.getElementById(
    "measureCoordinate"
)
.onclick=function(){

    removeMeasure();

    map.once(

        "click",

        function(evt){

            const coord =

                ol.proj.toLonLat(
                    evt.coordinate
                );

            alert(

                "Lat : " +

                coord[1]
                .toFixed(6)

                +

                "\nLon : " +

                coord[0]
                .toFixed(6)

            );

        }

    );

};

// =====================================
// MEASURE BEARING
// =====================================

document
.getElementById(
    "measureBearing"
)
.onclick=function(){

    removeMeasure();

    measureInteraction =

        new ol.interaction.Draw({

            source:
                measureSource,

            type:
                "LineString",

            maxPoints:2

        });

    map.addInteraction(
        measureInteraction
    );

    measureInteraction.on(

        "drawend",

        function(e){

            const coords =

                e.feature
                .getGeometry()
                .getCoordinates();

            const p1 =
                ol.proj.toLonLat(
                    coords[0]
                );

            const p2 =
                ol.proj.toLonLat(
                    coords[1]
                );

            const lat1 =
                p1[1] *
                Math.PI/180;

            const lat2 =
                p2[1] *
                Math.PI/180;

            const dLon =
                (p2[0]-p1[0]) *
                Math.PI/180;

            const y =
                Math.sin(dLon) *
                Math.cos(lat2);

            const x =
                Math.cos(lat1) *
                Math.sin(lat2)
                -
                Math.sin(lat1) *
                Math.cos(lat2) *
                Math.cos(dLon);

            let bearing =
                Math.atan2(y,x)
                *180/Math.PI;

            bearing =
                (bearing+360)%360;

            alert(

                "Bearing = "
                +
                bearing.toFixed(2)
                +
                "°"

            );

            removeMeasure();

        }

    );

};

// =====================================
// CLEAR MEASURE
// =====================================

document
.getElementById(
    "clearMeasure"
)
.onclick=function(){

    removeMeasure();

    measureSource.clear();

};

// =====================================
// CLOSE PANEL
// =====================================
measureBtn.onclick=function(){

    closeAllPanels();

    measurePanel.style.display=
    "block";

};