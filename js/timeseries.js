// =====================================
// OPEN TIME SERIES PANEL
// =====================================

document
.getElementById(
    "timeSeriesBtn"
)
.onclick=function(){

    document
    .getElementById(
        "timeSeriesPanel"
    )
    .style.display="block";

    setTimeout(function(){

        tsMap1.updateSize();
        tsMap2.updateSize();
        tsMap3.updateSize();
        tsMap4.updateSize();

    },200);

};


// =====================================
// CLOSE
// =====================================

document
.getElementById(
    "closeTimeSeries"
)
.onclick=function(){

    document
    .getElementById(
        "timeSeriesPanel"
    )
    .style.display="none";

};

// =====================================
// TIME SERIES MAPS
// =====================================

let tsView1 =
new ol.View({

    center:
    ol.proj.fromLonLat([
        78.9629,
        20.5937
    ]),

    zoom:5

});

let tsView2 =
new ol.View({

    center:
    ol.proj.fromLonLat([
        78.9629,
        20.5937
    ]),

    zoom:5

});

let tsView3 =
new ol.View({

    center:
    ol.proj.fromLonLat([
        78.9629,
        20.5937
    ]),

    zoom:5

});

let tsView4 =
new ol.View({

    center:
    ol.proj.fromLonLat([
        78.9629,
        20.5937
    ]),

    zoom:5

});


// =====================================
// MAP 1
// =====================================

let tsMap1 =
new ol.Map({

    target:"tsMap1",

    layers:[

        new ol.layer.Tile({

            source:
            new ol.source.OSM()

        })

    ],

    view:tsView1

});


// =====================================
// MAP 2
// =====================================

let tsMap2 =
new ol.Map({

    target:"tsMap2",

    layers:[

        new ol.layer.Tile({

            source:
            new ol.source.OSM()

        })

    ],

    view:tsView2

});


// =====================================
// MAP 3
// =====================================

let tsMap3 =
new ol.Map({

    target:"tsMap3",

    layers:[

        new ol.layer.Tile({

            source:
            new ol.source.OSM()

        })

    ],

    view:tsView3

});


// =====================================
// MAP 4
// =====================================

let tsMap4 =
new ol.Map({

    target:"tsMap4",

    layers:[

        new ol.layer.Tile({

            source:
            new ol.source.OSM()

        })

    ],

    view:tsView4

});

// =====================================
// SYNCHRONIZE MAPS
// =====================================

let sync = false;

function syncMaps(sourceView){

    if(sync){

        return;

    }

    sync = true;

    const center =
        sourceView.getCenter();

    const zoom =
        sourceView.getZoom();

    [
        tsView1,
        tsView2,
        tsView3,
        tsView4
    ]

    .forEach(

        function(v){

            if(v!==sourceView){

                v.setCenter(
                    center
                );

                v.setZoom(
                    zoom
                );

            }

        }

    );

    sync = false;
}


// =====================================
// VIEW EVENTS
// =====================================

tsView1.on(
    "change:center",
    function(){

        syncMaps(
            tsView1
        );

    }
);

tsView1.on(
    "change:resolution",
    function(){

        syncMaps(
            tsView1
        );

    }
);


tsView2.on(
    "change:center",
    function(){

        syncMaps(
            tsView2
        );

    }
);

tsView2.on(
    "change:resolution",
    function(){

        syncMaps(
            tsView2
        );

    }
);


tsView3.on(
    "change:center",
    function(){

        syncMaps(
            tsView3
        );

    }
);

tsView3.on(
    "change:resolution",
    function(){

        syncMaps(
            tsView3
        );

    }
);


tsView4.on(
    "change:center",
    function(){

        syncMaps(
            tsView4
        );

    }
);

tsView4.on(
    "change:resolution",
    function(){

        syncMaps(
            tsView4
        );

    }
);

// =====================================
// TIME SERIES DATES
// =====================================

const years = [

    "2018",
    "2019",
    "2020",
    "2021",
    "2022",
    "2023",
    "2024",
    "2025"

];

[
    "tsDate1",
    "tsDate2",
    "tsDate3",
    "tsDate4"

].forEach(

    function(id){

        const select =

            document
            .getElementById(id);

        years.forEach(

            function(year){

                const option =
                    document
                    .createElement(
                        "option"
                    );

                option.value =
                    year;

                option.text =
                    year;

                select.appendChild(
                    option
                );

            }

        );

    }

);


// =====================================
// DEFAULT YEARS
// =====================================

document
.getElementById(
    "tsDate1"
)
.value="2020";

document
.getElementById(
    "tsDate2"
)
.value="2021";

document
.getElementById(
    "tsDate3"
)
.value="2022";

document
.getElementById(
    "tsDate4"
)
.value="2023";