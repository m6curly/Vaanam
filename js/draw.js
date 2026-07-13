// =====================================
// VAANAM DRAW ENGINE
// PART-1 : CORE
// =====================================


// =====================================
// DRAW SOURCE
// =====================================

const drawSource =
drawLayer.getSource();


// =====================================
// DRAW STATE
// =====================================

const DrawState={

    interaction:null,

    mode:null,

    geometryFunction:null,

    feature:null,

    active:false,

    editing:false,

    snapping:false,

    modifying:false

};


// =====================================
// REMOVE INTERACTION
// =====================================

function removeDrawInteraction(){

    if(DrawState.interaction){

        map.removeInteraction(

            DrawState.interaction

        );

        DrawState.interaction=null;

    }

}


// =====================================
// RESET STATE
// =====================================

function resetDrawState(){

    removeDrawInteraction();

    DrawState.mode=null;

    DrawState.geometryFunction=null;

    DrawState.feature=null;

    DrawState.active=false;

}


// =====================================
// START DRAW
// =====================================

function startDraw(

    type,

    geometryFunction=null

){

    resetDrawState();

    DrawState.mode=type;

    DrawState.geometryFunction=

        geometryFunction;

    DrawState.active=true;

    DrawState.interaction=

    new ol.interaction.Draw({

        source:

        drawSource,

        type:

        type,

        geometryFunction:

        geometryFunction,

        stopClick:true

    });

    map.addInteraction(

        DrawState.interaction

    );

    registerDrawEvents();

}


// =====================================
// REGISTER EVENTS
// =====================================

function registerDrawEvents(){

    if(!DrawState.interaction)

        return;

    DrawState.interaction.on(

        "drawstart",

        function(e){

            DrawState.feature=

            e.feature;

        }

    );

    DrawState.interaction.on(

        "drawend",

        onDrawComplete

    );

}


// =====================================
// DRAW COMPLETE
// =====================================

function onDrawComplete(e){

    removeDrawInteraction();

    DrawState.active = false;

    DrawState.feature = e.feature;

    processCompletedFeature(

        e.feature

    );

}


// =====================================
// FEATURE COMPLETE
// =====================================

function processCompletedFeature(

    feature

){

    if(!feature)

        return;

    openFeaturePopup(

        feature

    );

}


// =====================================
// CANCEL DRAW
// =====================================

function cancelDraw(){

    resetDrawState();

}


// =====================================
// CLEAR DRAWINGS
// =====================================

function clearDrawings(){

    cancelDraw();

    drawSource.clear();

}


// =====================================
// ESC
// =====================================

document.addEventListener(

    "keydown",

    function(e){

        if(e.key==="Escape"){

            cancelDraw();

        }

    }

);


// =====================================
// DRAW BUTTON
// =====================================

document
.getElementById(
    "drawBtn"
)
.onclick=function(e){

    e.preventDefault();

    e.stopPropagation();

    togglePanel(

        "drawPanel"

    );

};


// =====================================
// PANEL
// =====================================

document
.getElementById(
    "drawPanel"
)
.onclick=function(e){

    e.stopPropagation();

};


// =====================================
// CLEAR
// =====================================

document
.getElementById(
    "clearDraw"
)
.onclick=function(){

    clearDrawings();

};


// =====================================
// DRAW TOOLS
// PART-2
// =====================================


// =====================================
// POINT
// =====================================

function activatePointTool(){

    startDraw(

        "Point"

    );

}


// =====================================
// LINE
// =====================================

function activateLineTool(){

    startDraw(

        "LineString"

    );

}


// =====================================
// POLYGON
// =====================================

function activatePolygonTool(){

    startDraw(

        "Polygon"

    );

}


// =====================================
// RECTANGLE
// =====================================

function activateRectangleTool(){

    startDraw(

        "Circle",

        ol.interaction.Draw.createBox()

    );

}


// =====================================
// CIRCLE
// =====================================

function activateCircleTool(){

    startDraw(

        "Circle"

    );

}


// =====================================
// RIGHT CLICK ENGINE
// =====================================

map.on(

    "pointerdown",

    function(evt){

        // Right Mouse Button Only

        if(

            evt.originalEvent.button !== 2

        ){

            return;

        }


        // Point Tool Only

        if(

            !DrawState.active ||

            DrawState.mode!=="Point"

        ){

            return;

        }


        // Disable Browser Menu

        evt.originalEvent.preventDefault();


        // Stop OpenLayers Draw

        removeDrawInteraction();

        DrawState.active = false;


        // Open Coordinate Popup

        openCoordinatePopup();

    }

);


// =====================================
// DISABLE BROWSER CONTEXT MENU
// =====================================

map.getViewport().addEventListener(

    "contextmenu",

    function(e){

        // Jab koi bhi Draw Tool active ho
        if(

            DrawState.active

        ){

            e.preventDefault();

            e.stopPropagation();

            return false;

        }

    },

    true

);


// =====================================
// DRAW BUTTONS
// =====================================

document

.getElementById(

    "drawPoint"

)

.onclick=function(){

    activatePointTool();

};



document

.getElementById(

    "drawLine"

)

.onclick=function(){

    activateLineTool();

};



document

.getElementById(

    "drawPolygon"

)

.onclick=function(){

    activatePolygonTool();

};



document

.getElementById(

    "drawRectangle"

)

.onclick=function(){

    activateRectangleTool();

};



document

.getElementById(

    "drawCircle"

)

.onclick=function(){

    activateCircleTool();

};


// =====================================
// VAANAM DRAW ENGINE
// PART-3 : WORKFLOW
// =====================================


// =====================================
// FEATURE COMPLETE
// =====================================

function processCompletedFeature(feature){

    if(!feature){

        return;

    }

    DrawState.feature = feature;

    openFeaturePopup(feature);

}


// =====================================
// AFTER FEATURE SAVE
// featurePopup.js will call this
// =====================================

window.finishFeatureDrawing = function(feature){

    if(!feature){

        return;

    }

    // Future :
    // Save to User Layer
    // Save to GeoJSON
    // Save to Database
    // Apply Default Style

    DrawState.feature = null;

    switch(DrawState.mode){

        case "Point":

            activatePointTool();

            break;

        case "LineString":

            activateLineTool();

            break;

        case "Polygon":

            activatePolygonTool();

            break;

        case "Circle":

            activateCircleTool();

            break;

    }

};


// =====================================
// AFTER COORDINATE CREATE
// coordinatePopup.js will call this
// =====================================

window.finishCoordinatePoint=function(feature){

    if(!feature){

        return;

    }

    processCompletedFeature(

        feature

    );

};


// =====================================
// CANCEL DRAW
// =====================================

window.cancelCurrentDraw=function(){

    cancelDraw();

};


// =====================================
// DRAW STATUS
// =====================================

window.isDrawActive=function(){

    return DrawState.active;

};


// =====================================
// CURRENT MODE
// =====================================

window.getCurrentDrawMode=function(){

    return DrawState.mode;

};


// =====================================
// FUTURE API
// =====================================

window.DrawEngine={

    start:startDraw,

    stop:cancelDraw,

    clear:clearDrawings,

    active:isDrawActive,

    mode:getCurrentDrawMode,

    feature:function(){

        return DrawState.feature;

    }

};

// =====================================
// DISABLE BROWSER RIGHT CLICK
// =====================================

document.addEventListener(

    "contextmenu",

    function(e){

        if(DrawState.active){

            e.preventDefault();

            e.stopPropagation();

            return false;

        }

    },

    true

);

console.log(
    "VAANAM Draw Engine Loaded"
);