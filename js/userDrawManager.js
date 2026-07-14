// =====================================
// CREATE USER DRAW LAYER
// =====================================

window.createUserDrawLayer = function (

    geometry,

    type

) {

    // Already exists
    if (
        userDrawLayers[geometry][type]
    ) {
        return userDrawLayers[geometry][type];
    }

    // Create source
    const source =
    new ol.source.Vector();

    // Create layer
    const layer =
    new ol.layer.Vector({

        source: source,

        visible: true

    });

    // Store info
    layer.set("geometry", geometry);

    layer.set("type", type);

    // Add to map
    map.addLayer(layer);

    // Save reference
    userDrawLayers[geometry][type] =
    layer;

    return layer;

};
