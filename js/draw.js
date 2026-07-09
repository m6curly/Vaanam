// =====================================
// DRAW SOURCE
// =====================================

const drawSource = drawLayer.getSource();


// =====================================
// DRAW VARIABLES
// =====================================

let drawInteraction = null;


// =====================================
// REMOVE DRAW INTERACTION
// =====================================

function removeDraw() {

    if (drawInteraction) {

        map.removeInteraction(drawInteraction);

        drawInteraction = null;

    }

}


// =====================================
// START DRAW
// =====================================

function startDraw(type, geometryFunction = null) {

    removeDraw();

    drawInteraction = new ol.interaction.Draw({

        source: drawSource,

        type: type,

        geometryFunction: geometryFunction,

        stopClick: true

    });

    map.addInteraction(drawInteraction);

    drawInteraction.once("drawend", function () {

        removeDraw();

    });

}


// =====================================
// DRAW PANEL
// =====================================

const drawBtn =
document.getElementById(
    "drawBtn"
);

drawBtn.onclick = function(e){

    e.preventDefault();

    e.stopPropagation();

    togglePanel(
        "drawPanel",
        this
    );

};


// =====================================
// PREVENT PANEL CLICK
// =====================================

document
.getElementById(
    "drawPanel"
)
.onclick = function(e){

    e.stopPropagation();

};


// =====================================
// DRAW POINT
// =====================================

document.getElementById("drawPoint").onclick = function () {

    startDraw("Point");

};


// =====================================
// DRAW LINE
// =====================================

document.getElementById("drawLine").onclick = function () {

    startDraw("LineString");

};


// =====================================
// DRAW POLYGON
// =====================================

document.getElementById("drawPolygon").onclick = function () {

    startDraw("Polygon");

};


// =====================================
// DRAW CIRCLE
// =====================================

document.getElementById("drawCircle").onclick = function () {

    startDraw("Circle");

};


// =====================================
// DRAW RECTANGLE
// =====================================

document.getElementById("drawRectangle").onclick = function () {

    startDraw(

        "Circle",

        ol.interaction.Draw.createBox()

    );

};


// =====================================
// CLEAR DRAWINGS
// =====================================

document.getElementById("clearDraw").onclick = function () {

    removeDraw();

    drawSource.clear();

};