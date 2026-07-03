// =====================================
// DOWNLOAD PANEL
// =====================================

const downloadsPanel =
document.getElementById(
    "downloadsPanel"
);

let downloadTimer;


// =====================================
// OPEN/CLOSE PANEL
// =====================================

document
.getElementById(
    "downloadsBtn"
)
.onclick = function(e){

    e.preventDefault();

    if(
        downloadsPanel
        .style.display
        ===
        "block"
    ){

        downloadsPanel
        .style.display =
        "none";

    }
    else{

        downloadsPanel
        .style.display =
        "block";

        startDownloadTimer();

    }

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