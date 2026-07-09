// =====================================
// DOWNLOAD PANEL
// =====================================

const downloadsBtn =
document.getElementById(
    "downloadsBtn"
);


// =====================================
// TOGGLE DOWNLOAD PANEL
// =====================================

downloadsBtn.onclick = function(e){

    e.preventDefault();

    e.stopPropagation();

    togglePanel(
        "downloadsPanel",
        this
    );

};


// =====================================
// OSM DATA
// =====================================

document
.getElementById(
    "osmLink"
)
.onclick = function(){

    window.open(
        "https://download.geofabrik.de",
        "_blank"
    );

};


// =====================================
// NATURAL EARTH
// =====================================

document
.getElementById(
    "naturalEarthLink"
)
.onclick = function(){

    window.open(
        "https://www.naturalearthdata.com/downloads/",
        "_blank"
    );

};


// =====================================
// DIVA GIS
// =====================================

document
.getElementById(
    "divaLink"
)
.onclick = function(){

    window.open(
        "https://diva-gis.org/data.html",
        "_blank"
    );

};