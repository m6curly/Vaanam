// =====================================
// OVERVIEW MAP
// =====================================

const overview =
new ol.control.OverviewMap({

    collapsed:false,

    layers:[

        new ol.layer.Tile({

            source:
            new ol.source.OSM()

        })

    ]

});

map.addControl(
    overview
);