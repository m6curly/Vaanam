// =====================================
// DRAW SOURCE
// =====================================

const drawSource =
    drawLayer.getSource();


// =====================================
// DRAW PANEL OPEN/CLOSE
// =====================================

document.addEventListener(

    "DOMContentLoaded",

    function(){

        const drawBtn =
            document.getElementById(
                "drawBtn"
            );

        const drawPanel =
            document.getElementById(
                "drawPanel"
            );

        if(
            drawBtn &&
            drawPanel
        ){

            drawBtn.onclick =
            function(){

                if(
                    drawPanel
                    .style.display
                    === "block"
                ){

                    drawPanel
                    .style.display =
                    "none";

                }

                else{

                    drawPanel
                    .style.display =
                    "block";

                }

            };

        }

    }

);


// =====================================
// DRAW VARIABLES
// =====================================

let drawInteraction = null;


// =====================================
// REMOVE OLD DRAW
// =====================================

function removeDraw(){

    if(drawInteraction){

        map.removeInteraction(
            drawInteraction
        );

        drawInteraction =
            null;
    }

}


// =====================================
// DRAW POINT
// =====================================

document
.getElementById("drawPoint")
.onclick = function () {

    removeDraw();

    drawInteraction = new ol.interaction.Draw({

        source: drawSource,

        type: "Point",

        stopClick: true

    });

    map.addInteraction(drawInteraction);

};


// =====================================
// DRAW LINE
// =====================================

document
.getElementById(
    "drawLine"
)
.onclick=function(){

    removeDraw();

    drawInteraction=

        new ol.interaction.Draw({

            source:
                drawSource,

            type:
                "LineString"

        });

    map.addInteraction(
        drawInteraction
    );

    drawInteraction.on(

        "drawend",

        function(){

            map.removeInteraction(
                drawInteraction
            );

            drawInteraction =
                null;

        }

    );

};


// =====================================
// DRAW POLYGON
// =====================================

document
.getElementById(
    "drawPolygon"
)
.onclick=function(){

    removeDraw();

    drawInteraction=

        new ol.interaction.Draw({

            source:
                drawSource,

            type:
                "Polygon"

        });

    map.addInteraction(
        drawInteraction
    );

    drawInteraction.on(

        "drawend",

        function(){

            map.removeInteraction(
                drawInteraction
            );

            drawInteraction =
                null;

        }

    );

};


// =====================================
// DRAW CIRCLE
// =====================================

document
.getElementById(
    "drawCircle"
)
.onclick=function(){

    removeDraw();

    drawInteraction=

        new ol.interaction.Draw({

            source:
                drawSource,

            type:
                "Circle"

        });

    map.addInteraction(
        drawInteraction
    );

    drawInteraction.on(

        "drawend",

        function(){

            map.removeInteraction(
                drawInteraction
            );

            drawInteraction =
                null;

        }

    );

};


// =====================================
// DRAW RECTANGLE
// =====================================

document
.getElementById(
    "drawRectangle"
)
.onclick=function(){

    removeDraw();

    drawInteraction=

        new ol.interaction.Draw({

            source:
                drawSource,

            type:
                "Circle",

            geometryFunction:
                ol.interaction.Draw
                .createBox()

        });

    map.addInteraction(
        drawInteraction
    );

    drawInteraction.on(

        "drawend",

        function(){

            map.removeInteraction(
                drawInteraction
            );

            drawInteraction =
                null;

        }

    );

};

// =====================================
// CLOSE PANEL
// =====================================

drawBtn.onclick=function(){

    closeAllPanels();

    drawPanel.style.display=
    "block";

};