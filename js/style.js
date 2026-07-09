// =====================================
// LOAD LABEL FIELDS
// =====================================

function loadLabelFields(layer){

    const select=document.getElementById("labelField");

    select.innerHTML="";

    const source=layer.getSource();

    if(!source) return;

    const features=source.getFeatures();

    if(features.length===0) return;

    const props=features[0].getProperties();

    for(let key in props){

        if(key!=="geometry"){

            const option=document.createElement("option");

            option.value=key;

            option.textContent=key;

            select.appendChild(option);

        }

    }

}


// =====================================
// CURRENT LAYER
// =====================================

let selectedLayer=null;


// =====================================
// OPEN STYLE PANEL
// =====================================

function openStylePanel(layer){

    selectedLayer=layer;

    loadLabelFields(layer);

    togglePanel("stylePanel");

}


// =====================================
// CLOSE STYLE PANEL
// =====================================

document
.getElementById("cancelStyle")
.onclick = function(){

    closePanel("stylePanel");

};


// =====================================
// APPLY STYLE
// =====================================

document.getElementById("applyStyle").onclick=function(){

    if(!selectedLayer){

        alert("No layer selected");

        return;

    }

    const fillColor=document.getElementById("fillColor").value;

    const strokeColor=document.getElementById("strokeColor").value;

    const strokeWidth=Number(document.getElementById("strokeWidth").value);

    const symbolSize=Number(document.getElementById("symbolSize").value);

    const labelEnable=document.getElementById("labelEnable").checked;

    const labelField=document.getElementById("labelField").value;

    const labelSize=Number(document.getElementById("labelSize").value);

    const labelColor=document.getElementById("labelColor").value;


    selectedLayer.setStyle(function(feature){

        const geometry=feature.getGeometry().getType();


        let textStyle;

        if(labelEnable){

            textStyle=new ol.style.Text({

                text:String(feature.get(labelField)||""),

                font:labelSize+"px Arial",

                fill:new ol.style.Fill({

                    color:labelColor

                }),

                stroke:new ol.style.Stroke({

                    color:"#ffffff",

                    width:3

                }),

                offsetY:-15

            });

        }


        // POINT

        if(

            geometry==="Point" ||

            geometry==="MultiPoint"

        ){

            return new ol.style.Style({

                image:new ol.style.Circle({

                    radius:symbolSize,

                    fill:new ol.style.Fill({

                        color:fillColor

                    }),

                    stroke:new ol.style.Stroke({

                        color:strokeColor,

                        width:strokeWidth

                    })

                }),

                text:textStyle

            });

        }


        // LINE

        if(

            geometry==="LineString" ||

            geometry==="MultiLineString"

        ){

            return new ol.style.Style({

                stroke:new ol.style.Stroke({

                    color:strokeColor,

                    width:strokeWidth

                }),

                text:textStyle

            });

        }


        // POLYGON

        return new ol.style.Style({

            fill:new ol.style.Fill({

                color:fillColor

            }),

            stroke:new ol.style.Stroke({

                color:strokeColor,

                width:strokeWidth

            }),

            text:textStyle

        });

    });

    selectedLayer.changed();

};


// =====================================
// OK
// =====================================

document
.getElementById("okStyle")
.onclick = function(){

    document.getElementById("applyStyle").click();

    closePanel("stylePanel");

};


// =====================================
// CANCEL
// =====================================

document.getElementById("cancelStyle").onclick=function(){

    closeStylePanel();

};