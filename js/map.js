// =====================================
// HOME LOCATION
// =====================================

// India center
const HOME_CENTER =
ol.proj.fromLonLat([
    78.9629,
    20.5937
]);

// Initial zoom
const HOME_ZOOM = 5;


// =====================================
// MAP VIEW
// =====================================

const view =
new ol.View({

    center:
    HOME_CENTER,

    zoom:
    HOME_ZOOM,

    projection:
    "EPSG:3857"

});


// =====================================
// BASEMAPS
// =====================================

// =====================================
// OSM
// =====================================

const osmLayer =
new ol.layer.Tile({

    visible:true,

    source:
    new ol.source.OSM()

});

// =====================================
// SATELLITE
// =====================================

const satelliteLayer =
new ol.layer.Tile({

    visible:false,

    source:
    new ol.source.XYZ({

        url:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"

    })

});

// =====================================
// TERRAIN
// =====================================

const terrainLayer =
new ol.layer.Tile({

    visible:false,

    source:
    new ol.source.XYZ({

        url:
        "https://tile.opentopomap.org/{z}/{x}/{y}.png"

    })

});


// =====================================
// CARTO LIGHT
// =====================================

const cartoLight =

new ol.layer.Tile({

    visible:false,

    source:
    new ol.source.XYZ({

        url:
        "https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"

    })

});


// =====================================
// CARTO DARK
// =====================================

const cartoDark =

new ol.layer.Tile({

    visible:false,

    source:
    new ol.source.XYZ({

        url:
        "https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"

    })

});


// =====================================
// ESRI STREET
// =====================================

const streetLayer =

new ol.layer.Tile({

    visible:false,

    source:
    new ol.source.XYZ({

        url:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"

    })

});


// =====================================
// NATIONAL GEOGRAPHIC
// =====================================

const natGeoLayer =

new ol.layer.Tile({

    visible:false,

    source:
    new ol.source.XYZ({

        url:
        "https://services.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}"

    })

});


// =====================================
// HUMANITARIAN
// =====================================

const humanitarianLayer =

new ol.layer.Tile({

    visible:false,

    source:
    new ol.source.XYZ({

        url:
        "https://tile-{a-c}.openstreetmap.fr/hot/{z}/{x}/{y}.png"

    })

});


// =====================================
// VECTOR LAYERS
// =====================================

const drawLayer =
new ol.layer.Vector({

    source:
    new ol.source.Vector(),

    style:
    new ol.style.Style({

        stroke:
        new ol.style.Stroke({

            color:"red",

            width:2

        }),

        fill:
        new ol.style.Fill({

            color:
            "rgba(255,0,0,0.2)"

        }),

        image:
        new ol.style.Circle({

            radius:6,

            fill:
            new ol.style.Fill({

                color:"red"

            })

        })

    })

});


const uploadLayer =
new ol.layer.Vector({

    source:
    new ol.source.Vector()

});


// =====================================
// MAP
// =====================================

const map =
new ol.Map({

    target:"map",

    layers:[

        osmLayer,
        satelliteLayer,
        terrainLayer,
        cartoLight,
        cartoDark,
        streetLayer,
        natGeoLayer,
        humanitarianLayer,
        drawLayer
    ],

    view:view

});


// =====================================
// VARIABLES
// =====================================

let draw = null;

let measure = null;

let rotate = null;


// =====================================
// USER LAYERS
// =====================================

let userLayers=[];


// =====================================
// SEARCH MARKER
// =====================================

const searchSource =
new ol.source.Vector();

const searchLayer =
new ol.layer.Vector({

    source:searchSource,

    style:new ol.style.Style({

        image:
        new ol.style.RegularShape({

            points:4,

            radius:10,

            radius2:1,

            angle:0,

            stroke:
            new ol.style.Stroke({

                color:"red",

                width:3

            }),

            fill:
            new ol.style.Fill({

                color:
                "rgba(255,0,0,0)"

            })

        })

    })

});

map.addLayer(
    searchLayer
);

