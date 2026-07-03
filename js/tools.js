// =====================================
// TOOLS PANEL
// =====================================

document
.getElementById(
    "toolsBtn"
)
.onclick = function(){

    const panel =
    document
    .getElementById(
        "toolsPanel"
    );

    panel.style.display =

    panel.style.display ===
    "block"

    ?

    "none"

    :

    "block";

};


// =====================================
// BUFFER VARIABLES
// =====================================

let bufferMode = false;

let bufferCoordinate = null;


// =====================================
// BUFFER TOOL
// =====================================

document
.getElementById(
    "bufferTool"
)
.onclick = function(){

    bufferMode = true;

};


// =====================================
// MAP CLICK
// =====================================

map.on(

    "singleclick",

    function(evt){

        if(
            !bufferMode
        )
        return;

        bufferCoordinate =
        evt.coordinate;

        const popup =

        document
        .getElementById(
            "bufferPopup"
        );

        popup.style.left =

        evt.pixel[0]
        + "px";

        popup.style.top =

        evt.pixel[1]
        + "px";

        popup.style.display =

        "block";

    }

);


// =====================================
// CREATE BUFFER
// =====================================

document
.getElementById(
    "createBuffer"
)
.onclick = function(){

    if(
        !bufferCoordinate
    ){

        alert(
            "Pehle map me click karein"
        );

        return;

    }

    const km =

    Number(

        document
        .getElementById(
            "bufferInput"
        ).value

    );

    if(

        isNaN(km)

        ||

        km <= 0

    ){

        alert(
            "Valid distance enter karein"
        );

        return;

    }

    const radius =

    km * 1000;


    // circle geometry

    const circle =

    new ol.geom.Circle(

        bufferCoordinate,

        radius

    );


    // polygon buffer

    const polygon =

    ol.geom.Polygon
    .fromCircle(

        circle,

        64

    );


    // feature

    const feature =

    new ol.Feature({

        geometry:

        polygon

    });


    // add feature

    bufferLayer
    .getSource()
    .addFeature(

        feature

    );


    // close popup

    document
    .getElementById(
        "bufferPopup"
    )
    .style.display =

    "none";


    // reset

    bufferMode = false;

    bufferCoordinate = null;

};


// =====================================
// CANCEL BUFFER
// =====================================

const cancelBtn =

document
.getElementById(
    "cancelBuffer"
);

if(cancelBtn){

    cancelBtn.onclick = function(){

        document
        .getElementById(
            "bufferPopup"
        )
        .style.display =

        "none";

        bufferMode = false;

        bufferCoordinate = null;

    };

}

// =====================================
// CLOSE PANEL
// =====================================
toolsBtn.onclick=function(){

    closeAllPanels();

    toolsPanel.style.display=
    "block";

};