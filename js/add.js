// =====================================
// ADD BUTTON
// =====================================

document.addEventListener("DOMContentLoaded",function(){

    document.getElementById("addBtn").onclick=function(){

        document.getElementById("fileInput").click();

    };

});


// =====================================
// FILE INPUT
// =====================================

document.getElementById("fileInput").onchange=function(e){

    const files=e.target.files;

    if(!files.length) return;

    for(let i=0;i<files.length;i++){

        const file=files[i];

        const name=file.name.toLowerCase();

        if(

            name.endsWith(".geojson") ||

            name.endsWith(".json")

        ){

            loadGeoJSON(file);

        }

        else if(

            name.endsWith(".tif") ||

            name.endsWith(".tiff")

        ){

            loadGeoTIFF(file);

        }

        else{

            alert(file.name+" : Unsupported format");

        }

    }

    this.value="";

};


// =====================================
// LOAD GEOJSON
// =====================================

function loadGeoJSON(file){

    const reader=new FileReader();

    reader.onload=function(e){

        const features=new ol.format.GeoJSON().readFeatures(

            e.target.result,

            {

                featureProjection:"EPSG:3857"

            }

        );

        const source=new ol.source.Vector({

            features:features

        });

        const layer=new ol.layer.Vector({

            source:source

        });

        map.addLayer(layer);

        if(window.userLayers){

            userLayers.push({

                name:file.name,

                layer:layer,

                source:source

            });

        }

        addUserLayer(

            file.name.replace(/\.[^/.]+$/,""),

            layer

        );

        map.getView().fit(

            source.getExtent(),

            {

                duration:500,

                padding:[40,40,40,40]

            }

        );

    };

    reader.readAsText(file);

}


// =====================================
// LOAD GEOTIFF
// =====================================

function loadGeoTIFF(file){

    const url=URL.createObjectURL(file);

    const layer=new ol.layer.WebGLTile({

        preload:1,

        source:new ol.source.GeoTIFF({

            normalize:false,

            interpolate:false,

            sources:[

                {

                    url:url

                }

            ]

        })

    });

    map.addLayer(layer);

    if(window.userLayers){

        userLayers.push({

            name:file.name,

            layer:layer

        });

    }

    addUserLayer(

        file.name.replace(/\.[^/.]+$/,""),

        layer

    );

}