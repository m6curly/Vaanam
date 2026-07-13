// =====================================
// VAANAM COORDINATE POPUP
// =====================================

let coordinatePoint = null;


// =====================================
// OPEN
// =====================================

window.openCoordinatePopup = function(){

    document.getElementById(
        "inputLat"
    ).value = "";

    document.getElementById(
        "inputLon"
    ).value = "";

    openPanel(
        "coordinatePopup"
    );

};


// =====================================
// CLOSE
// =====================================

function closeCoordinatePopup(){

    closePanel(
        "coordinatePopup"
    );

}


// =====================================
// CANCEL
// =====================================

document
.getElementById(
    "cancelCoordinate"
)
.onclick = function(){

    closeCoordinatePopup();

    if(

        typeof finishFeatureDrawing===

        "function"

    ){

        finishFeatureDrawing(

            null

        );

    }

};


// =====================================
// CREATE POINT
// =====================================

document
.getElementById(
    "createPoint"
)
.onclick = function(){

    const lat = parseFloat(

        document
        .getElementById(
            "inputLat"
        ).value

    );

    const lon = parseFloat(

        document
        .getElementById(
            "inputLon"
        ).value

    );


    // =====================================
    // VALIDATION
    // =====================================

    if(

        isNaN(lat) ||

        isNaN(lon)

    ){

        alert(

            "Enter valid coordinates."

        );

        return;

    }

    if(

        lat < -90 ||

        lat > 90

    ){

        alert(

            "Latitude must be between -90 and 90."

        );

        return;

    }

    if(

        lon < -180 ||

        lon > 180

    ){

        alert(

            "Longitude must be between -180 and 180."

        );

        return;

    }


    // =====================================
    // CREATE FEATURE
    // =====================================

    coordinatePoint =

    new ol.Feature({

        geometry :

        new ol.geom.Point(

            ol.proj.fromLonLat(

                [

                    lon,

                    lat

                ]

            )

        )

    });


    drawSource.addFeature(

        coordinatePoint

    );


    // =====================================
    // ZOOM
    // =====================================

    map.getView().animate({

        center :

        ol.proj.fromLonLat(

            [

                lon,

                lat

            ]

        ),

        zoom : 14,

        duration : 600

    });


    closeCoordinatePopup();


    // =====================================
    // FEATURE POPUP
    // =====================================

    if(

        typeof finishCoordinatePoint===

        "function"

    ){

        finishCoordinatePoint(

            coordinatePoint

        );

    }

    else{

        openFeaturePopup(

            coordinatePoint

        );

    }

};


// =====================================
// ENTER KEY
// =====================================

document
.getElementById(
    "inputLon"
)
.addEventListener(

    "keydown",

    function(e){

        if(

            e.key==="Enter"

        ){

            document
            .getElementById(
                "createPoint"
            )
            .click();

        }

    }

);

console.log(
    "Coordinate Popup Loaded"
);

// =====================================
// DISABLE RIGHT CLICK
// =====================================

const coordinatePopup =
document.getElementById(
    "coordinatePopup"
);

coordinatePopup.addEventListener(

    "contextmenu",

    function(e){

        e.preventDefault();

        e.stopPropagation();

        return false;

    },

    true

);

document
.getElementById(
    "inputLat"
)
.oncontextmenu=function(){

    return false;

};

document
.getElementById(
    "inputLon"
)
.oncontextmenu=function(){

    return false;

};