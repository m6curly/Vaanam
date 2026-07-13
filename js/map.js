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
// SATELLITE
// =====================================

const satelliteLayer =
new ol.layer.Tile({

    visible:true,

    source:
    new ol.source.XYZ({

        url:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"

    })

});

// =====================================
// OSM
// =====================================

const osmLayer =
new ol.layer.Tile({

    visible:false,

    source:
    new ol.source.OSM()

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

    source:new ol.source.Vector(),

    style:function(feature){

        return new ol.style.Style({

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

                text:feature.get("name") || "",

                font:"bold 12px Arial",

                offsetY:-15,

                fill:new ol.style.Fill({

                    color:"#ffffff"

                }),

                stroke:new ol.style.Stroke({

                    color:"#000000",

                    width:3

                })

            })

        });

    }

});
// =====================================
// USER DRAW LAYERS
// =====================================

window.userDrawLayers = {

    Point:{},

    Line:{},

    Polygon:{}

};

const uploadLayer =
new ol.layer.Vector({

    source:
    new ol.source.Vector()

});

// =====================================
// DEFAULT DRAW STYLE
// =====================================

window.applyDefaultFeatureStyle=function(feature){

    feature.setStyle(

        function(f){

            return new ol.style.Style({

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

                    color:"rgba(255,0,0,0.25)"

                }),

                text:new ol.style.Text({

                    text:f.get("name") || "",

                    font:"bold 12px Arial",

                    offsetY:-15,

                    fill:new ol.style.Fill({

                        color:"#ffffff"

                    }),

                    stroke:new ol.style.Stroke({

                        color:"#000000",

                        width:3

                    })

                })

            });

        }

    );

};

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
    drawLayer,

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

// =====================================
// LOAD BASE LAYER
// =====================================

function loadBaseLayer(

    name,
    url

){

    fetch(url)

    .then(r=>r.json())

    .then(data=>{

        const source =
        new ol.source.Vector({

            features:

            new ol.format.GeoJSON()

            .readFeatures(

                data,

                {

                    featureProjection:
                    "EPSG:3857"

                }

            )

        });


        const layer =

new ol.layer.Vector({

    source:source,

    visible: false

});

// =====================================
// PLACES STYLE
// =====================================

if(name==="Places"){

    layer.setStyle(

        function(feature){

            return new ol.style.Style({

                image:

                new ol.style.Circle({

                    radius:4,

                    fill:
                    new ol.style.Fill({

                        color:"#FFFF00"

                    }),

                    stroke:
                    new ol.style.Stroke({

                        color:"#000000",

                        width:1.5

                    })

                }),

                text:

                new ol.style.Text({

                    text:
                    feature.get("name"),

                    font:
                    "bold 10px Arial",

                    offsetX:10,
                    offsetY:-2,

                    textAlign:"left",

                    fill:
                    new ol.style.Fill({

                        color:"#FFFFFF"

                    }),

                    stroke:
                    new ol.style.Stroke({

                        color:"#000000",

                        width:4

                    })

                })

            });

        }

    );

}

// =====================================
// AIRPORT STYLE
// =====================================

if(name==="Airport"){

    layer.setStyle(

        function(feature){

            return new ol.style.Style({

                image:

                new ol.style.Icon({

                    src:
                    "assets/symbols/airport.svg",

                    scale:0.03,

                    anchor:[0.5,1]

                }),

                text:

                new ol.style.Text({

                    text:
                    feature.get("name"),

                    font:
                    "bold 11px Arial",

                    offsetX:12,
                    offsetY:-2,

                    textAlign:"left",

                    fill:
                    new ol.style.Fill({

                        color:"#FFFFFF"

                    }),

                    stroke:
                    new ol.style.Stroke({

                        color:"#000000",

                        width:4

                    })

                })

            });

        }

    );

}


// =====================================
// PORT STYLE
// =====================================

if(name==="Port"){

    layer.setStyle(

        function(feature){

            return new ol.style.Style({

                image:

                new ol.style.Icon({

                    src:
                    "assets/symbols/port.svg",

                    scale:0.02,

                    anchor:[0.5,1]

                }),

                text:

                new ol.style.Text({

                    text:
                    feature.get("name"),

                    font:
                    "bold 11px Arial",

                    offsetX:12,
                    offsetY:-2,

                    textAlign:"left",

                    fill:
                    new ol.style.Fill({

                        color:"#FFFFFF"

                    }),

                    stroke:
                    new ol.style.Stroke({

                        color:"#000000",

                        width:4

                    })

                })

            });

        }

    );

}

// =====================================
// ROAD STYLE
// =====================================

if(name==="Road"){

    layer.setStyle(

        new ol.style.Style({

            stroke:

            new ol.style.Stroke({

                color:"#FFD700",

                width:2

            })

        })

    );

}

// =====================================
// RIVER STYLE
// =====================================

if(name==="River"){

    layer.setStyle(

        function(feature){

            return new ol.style.Style({

                stroke:

                new ol.style.Stroke({

                    color:"#00BFFF",

                    width:1.8

                }),

                text:

                new ol.style.Text({

                    text:
                    feature.get("name"),

                    font:
                    "bold 10px Arial",

                    fill:
                    new ol.style.Fill({

                        color:"#00FFFF"

                    }),

                    stroke:
                    new ol.style.Stroke({

                        color:"#000000",

                        width:4

                    })

                })

            });

        }

    );

}

// =====================================
// BOUNDARY STYLE
// =====================================

if(name==="Boundary"){

    layer.setStyle(

        function(feature){

            return new ol.style.Style({

                fill:new ol.style.Fill({

                    color:"#d9d9d9"

                }),

                stroke:new ol.style.Stroke({

                    color:"#000000",

                    width:1.5

                }),

                text:new ol.style.Text({

                    text:feature.get("name") || "",

                    font:"12px Arial",

                    fill:new ol.style.Fill({

                        color:"#000000"

                    }),

                    overflow:true

                })

            });

        }

    );

}

        map.addLayer(
            layer
        );


        // =====================
        // STORE GLOBALLY
        // =====================

        if(name==="Places")
            window.placeLayer=layer;

        if(name==="Airport")
            window.airportLayer=layer;

        if(name==="Port")
            window.portLayer=layer;

        if(name==="Road")
            window.roadLayer=layer;

        if(name==="River")
            window.riverLayer=layer;

        if(name==="Boundary")
            window.boundaryLayer=layer;

    });

}

// =====================================
// LOAD ALL BASE DATA
// =====================================

loadBaseLayer(
    "Boundary",
    "data/Boundary.geojson"
);

loadBaseLayer(
    "River",
    "data/River.geojson"
);

loadBaseLayer(
    "Road",
    "data/Road.geojson"
);

loadBaseLayer(
    "Port",
    "data/Port.geojson"
);

loadBaseLayer(
    "Airport",
    "data/Airport.geojson"
);