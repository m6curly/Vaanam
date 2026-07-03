// =====================================
// BASEMAP PANEL SHOW/HIDE
// =====================================

document
.getElementById("basemapBtn")
.onclick=function(){
closeLayerPanel();
    const panel=
    document.getElementById(
        "basemapPanel"
    );

    if(panel.style.display==="block"){

        panel.style.display="none";

    }
    else{

        panel.style.display="block";

    }

};

// =====================================
// HIDE ALL BASEMAPS
// =====================================

function hideBasemaps(){

    osmLayer.setVisible(false);

    satelliteLayer.setVisible(false);

    terrainLayer.setVisible(false);

    cartoLight.setVisible(false);

    cartoDark.setVisible(false);

    streetLayer.setVisible(false);

    natGeoLayer.setVisible(false);

    humanitarianLayer.setVisible(false);

}


// =====================================
// OSM
// =====================================

document
.getElementById(
    "osmMap"
)
.onclick=function(){

    hideBasemaps();

    osmLayer.setVisible(true);

};


// =====================================
// SATELLITE
// =====================================

document
.getElementById(
    "satelliteMap"
)
.onclick=function(){

    hideBasemaps();

    satelliteLayer.setVisible(true);

};


// =====================================
// TERRAIN
// =====================================

document
.getElementById(
    "terrainMap"
)
.onclick=function(){

    hideBasemaps();

    terrainLayer.setVisible(true);

};

// =====================================
// CARTO LIGHT
// =====================================

document
.getElementById(
    "cartoLightMap"
)
.onclick=function(){

    hideBasemaps();

    cartoLight.setVisible(true);

};


// =====================================
// CARTO DARK
// =====================================

document
.getElementById(
    "cartoDarkMap"
)
.onclick=function(){

    hideBasemaps();

    cartoDark.setVisible(true);

};


// =====================================
// STREET
// =====================================

document
.getElementById(
    "streetMap"
)
.onclick=function(){

    hideBasemaps();

    streetLayer.setVisible(true);

};


// =====================================
// NATIONAL GEOGRAPHIC
// =====================================

document
.getElementById(
    "natGeoMap"
)
.onclick=function(){

    hideBasemaps();

    natGeoLayer.setVisible(true);

};


// =====================================
// HUMANITARIAN
// =====================================

document
.getElementById(
    "humanitarianMap"
)
.onclick=function(){

    hideBasemaps();

    humanitarianLayer.setVisible(true);

};

// =====================================
// CLOSE PANEL
// =====================================
basemapBtn.onclick=function(){

    closeAllPanels();

    basemapPanel.style.display=
    "block";

};