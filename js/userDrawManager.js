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

// =====================================
// CREATE TYPE IN TREE
// =====================================

window.addDrawType = function (

    geometry,

    type

){

    const parent =

    document.getElementById(

        geometry + "Root"

    );

    if(!parent) return;

    // Already exists
    if(

        document.getElementById(

            geometry + "_" + type

        )

    ) return;

    const row =

    document.createElement("div");

    row.id =

    geometry + "_" + type;

    row.className =

    "layerItem";

    row.style.marginLeft =

    "20px";

    // Checkbox
    const check =

    document.createElement("input");

    check.type =

    "checkbox";

    check.checked = true;

    // Label
    const label =

    document.createElement("span");

    label.innerHTML =

    type;

    row.appendChild(check);

    row.appendChild(label);

    parent.appendChild(row);

    // Visibility
    check.onchange = function(){

        const layer =

        userDrawLayers
        [geometry]
        [type];

        if(layer){

            layer.setVisible(

                this.checked

            );

        }

    };

};