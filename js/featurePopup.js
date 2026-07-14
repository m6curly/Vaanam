// =====================================
// VAANAM FEATURE POPUP
// =====================================

window.currentFeature = null;


// =====================================
// OPEN POPUP
// =====================================

window.openFeaturePopup = function(feature){

    if(!feature){

        return;

    }

    currentFeature = feature;

    document.getElementById(

        "featureName"

    ).value =

    feature.get("name") || "";

    document.getElementById(

        "featureType"

    ).value =

    feature.get("type") || "";

    document.getElementById(

        "featureDescription"

    ).value =

    feature.get("description") || "";

    openPanel(

        "featurePopup"

    );

};


// =====================================
// CLOSE
// =====================================

function closeFeaturePopup(){

    closePanel(

        "featurePopup"

    );

}


// =====================================
// CANCEL
// =====================================

document

.getElementById(

    "cancelFeature"

)

.onclick = function(){

    if(currentFeature){

        drawSource.removeFeature(

            currentFeature

        );

        currentFeature = null;

    }

    closeFeaturePopup();

    if(

        typeof finishFeatureDrawing ===

        "function"

    ){

        finishFeatureDrawing(

            null

        );

    }

};


// =====================================
// SAVE
// =====================================

document

.getElementById(

    "saveFeature"

)

.onclick = function(){

    if(!currentFeature){

        return;

    }

    const name =

    document

    .getElementById(

        "featureName"

    )

    .value

    .trim();

    const type =

    document

    .getElementById(

        "featureType"

    )

    .value

    .trim();

    const description =

    document

    .getElementById(

        "featureDescription"

    )

    .value

    .trim();

    // =====================================
// VALIDATE TYPE
// =====================================

if(

    !FEATURE_TYPES.includes(type)

){

    alert(

        "Please select a valid Feature Type."

    );

    return;

}

    if(

        name === ""

        ||

        type === ""

    ){

        alert(

            "Name and Type are required."

        );

        return;

    }

    currentFeature.set(

        "name",

        name

    );

    currentFeature.set(

        "type",

        type

    );

    currentFeature.set(

        "description",

        description

    );

    currentFeature.set(

        "created",

        new Date().toISOString()

    );

    let folder = "Polygon";

    const geometry =

    currentFeature

    .getGeometry()

    .getType();

    if(

        geometry === "Point"

    ){

        folder = "Point";

    }

    else if(

        geometry === "LineString"

    ){

        folder = "Line";

    }

        // =====================================
    // USER DRAW TREE
    // =====================================

    addDrawFeature(

        folder,

        type,

        currentFeature

    );


    // =====================================
    // DEFAULT STYLE
    // =====================================

    currentFeature.setStyle(

        new ol.style.Style({

            image:new ol.style.Circle({

                radius:6,

                fill:new ol.style.Fill({

                    color:"#ff0000"

                }),

                stroke:new ol.style.Stroke({

                    color:"#ffffff",

                    width:2

                })

            }),

            stroke:new ol.style.Stroke({

                color:"#ff0000",

                width:2

            }),

            fill:new ol.style.Fill({

                color:"rgba(255,0,0,0.20)"

            }),

            text:new ol.style.Text({

                text:name,

                offsetY:-15,

                font:"bold 12px Arial",

                fill:new ol.style.Fill({

                    color:"#ffffff"

                }),

                stroke:new ol.style.Stroke({

                    color:"#000000",

                    width:3

                })

            })

        })

    );


    // =====================================
    // FINISH
    // =====================================

    const savedFeature = currentFeature;

    currentFeature = null;

    closeFeaturePopup();

    if(

        typeof finishFeatureDrawing ===

        "function"

    ){

        finishFeatureDrawing(

            savedFeature

        );

    }

};


// =====================================
// ESC
// =====================================

document.addEventListener(

    "keydown",

    function(e){

        if(

            e.key === "Escape"

        ){

            const popup =

            document.getElementById(

                "featurePopup"

            );

            if(

                popup.style.display === "block"

            ){

                closeFeaturePopup();

            }

        }

    }

);


console.log(

    "Feature Popup Loaded"

);