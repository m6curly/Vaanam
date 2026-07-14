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

    active:false

};


// =====================================
// REMOVE DRAW
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
// RESET
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

    if(!DrawState.interaction){

        return;

    }

    DrawState.interaction.on(

        "drawstart",

        function(e){

            DrawState.feature=

            e.feature;

        }

    );

    DrawState.interaction.on(

        "drawend",

        function(e){

            removeDrawInteraction();

            DrawState.active=false;

            DrawState.feature=e.feature;

            openFeaturePopup(

                e.feature

            );

        }

    );

}


// =====================================
// CANCEL
// =====================================

function cancelDraw(){

    resetDrawState();

}


// =====================================
// CLEAR ALL
// =====================================

function clearDrawings(){

    cancelDraw();

    drawSource.clear();

    if(

        typeof initUserDrawTree===

        "function"

    ){

        initUserDrawTree();

    }

}


// =====================================
// ESC
// =====================================

document.addEventListener(

    "keydown",

    function(e){

        if(

            e.key==="Escape"

        ){

            cancelDraw();

        }

    }

);


// =====================================
// DRAW PANEL
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
// PANEL CLICK
// =====================================

document

.getElementById(

    "drawPanel"

)

.onclick=function(e){

    e.stopPropagation();

};


// =====================================
// CLEAR BUTTON
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
// RIGHT CLICK FOR POINT
// =====================================

map.on(

    "pointerdown",

    function(evt){

        if(

            evt.originalEvent.button!==2

        ){

            return;

        }

        if(

            !DrawState.active ||

            DrawState.mode!=="Point"

        ){

            return;

        }

        evt.originalEvent.preventDefault();

        removeDrawInteraction();

        DrawState.active=false;

        openCoordinatePopup();

    }

);


// =====================================
// DISABLE CONTEXT MENU
// =====================================

document.addEventListener(

    "contextmenu",

    function(e){

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
// BUTTONS
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
// AFTER FEATURE SAVE
// featurePopup.js calls this
// =====================================

window.finishFeatureDrawing=function(feature){

    // User pressed Cancel
    if(!feature){

        DrawState.feature=null;

        return;

    }

    // Clear current feature
    DrawState.feature=null;

    // Keep same tool active
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

            if(DrawState.geometryFunction){

                activateRectangleTool();

            }

            else{

                activateCircleTool();

            }

            break;

    }

};


// =====================================
// AFTER COORDINATE POINT
// coordinatePopup.js calls this
// =====================================

window.finishCoordinatePoint=function(feature){

    if(!feature){

        return;

    }

    DrawState.feature=feature;

    openFeaturePopup(

        feature

    );

};


// =====================================
// CANCEL FROM OTHER FILES
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
// PUBLIC API
// =====================================

window.DrawEngine={

    start:startDraw,

    stop:cancelDraw,

    clear:clearDrawings,

    active:function(){

        return DrawState.active;

    },

    mode:function(){

        return DrawState.mode;

    },

    feature:function(){

        return DrawState.feature;

    }

};


// =====================================
// READY
// =====================================

console.log(

    "VAANAM Draw Engine Loaded"

);