// =====================================
// LAYER PANEL
// =====================================

document
.getElementById("layerBtn")
.onclick = function(){

    closeAllPanels();

    document
    .getElementById(
        "layerPanel"
    )
    .style.display =
    "block";

};


// =====================================
// BASE LAYER CHECKBOX EVENTS
// =====================================

document
.getElementById(
    "placeCheck"
)
.onchange =
function(){

    if(window.placeLayer){

        placeLayer.setVisible(
            this.checked
        );

    }

};


document
.getElementById(
    "airportCheck"
)
.onchange =
function(){

    if(window.airportLayer){

        airportLayer.setVisible(
            this.checked
        );

    }

};


document
.getElementById(
    "portCheck"
)
.onchange =
function(){

    if(window.portLayer){

        portLayer.setVisible(
            this.checked
        );

    }

};


document
.getElementById(
    "roadCheck"
)
.onchange =
function(){

    if(window.roadLayer){

        roadLayer.setVisible(
            this.checked
        );

    }

};


document
.getElementById(
    "riverCheck"
)
.onchange =
function(){

    if(window.riverLayer){

        riverLayer.setVisible(
            this.checked
        );

    }

};


document
.getElementById(
    "boundaryCheck"
)
.onchange =
function(){

    if(window.boundaryLayer){

        boundaryLayer.setVisible(
            this.checked
        );

    }

};