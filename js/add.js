// =====================================
// ADD BUTTON
// =====================================

document
.getElementById("addBtn")
.onclick = function () {

    document
    .getElementById("fileInput")
    .click();

};


// =====================================
// FILE INPUT
// =====================================

document
.getElementById("fileInput")
.onchange = function (e) {

    const files = e.target.files;

    if (files.length === 0) return;

    for (

        let i = 0;

        i < files.length;

        i++

    ) {

        const file = files[i];

        const name = file.name.toLowerCase();

        // =====================
        // GEOJSON
        // =====================

        if (

            name.endsWith(".geojson") ||

            name.endsWith(".json")

        ) {

            loadGeoJSON(file);

        }

        // =====================
        // GEOTIFF
        // =====================

        else if (

            name.endsWith(".tif") ||

            name.endsWith(".tiff")

        ) {

            loadGeoTIFF(file);

        }

        // =====================
        // OTHER
        // =====================

        else {

            alert(

                file.name +

                " : Format not supported"

            );

        }

    }

    // Allow selecting same file again

    e.target.value = "";

};


// =====================================
// LOAD GEOJSON
// =====================================

function loadGeoJSON(file) {

    const reader =

    new FileReader();

    reader.onload = function (evt) {

        const features =

        new ol.format.GeoJSON()

        .readFeatures(

            evt.target.result,

            {

                featureProjection: "EPSG:3857"

            }

        );

        const source =

        new ol.source.Vector({

            features: features

        });

        const layer =

        new ol.layer.Vector({

            source: source

        });

        // Add map

        map.addLayer(layer);

        // Store

        userLayers.push({

            name: file.name,

            layer: layer,

            source: source

        });

        // Layer name

        const layerName =

        file.name.split(".")[0];

        // Layer Manager

        addLayerToManager(

            layerName,

            layer

        );

        // Zoom

        map.getView().fit(

            source.getExtent(),

            {

                duration: 500

            }

        );

    };

    reader.readAsText(file);

}


// =====================================
// LOAD GEOTIFF
// =====================================

function loadGeoTIFF(file) {

    const url =

    URL.createObjectURL(file);

    const layer =

    new ol.layer.WebGLTile({

        preload: 1,

        source:

        new ol.source.GeoTIFF({

            normalize: false,

            interpolate: false,

            sources: [

                {

                    url: url

                }

            ]

        })

    });

    map.addLayer(layer);

    userLayers.push({

        name: file.name,

        layer: layer

    });

    const layerName =

    file.name.split(".")[0];

    addLayerToManager(

        layerName,

        layer

    );

}