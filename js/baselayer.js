// =====================================
// LAYER PANEL
// =====================================

document
.getElementById("layerBtn")
.onclick = function(e){

    e.preventDefault();

    e.stopPropagation();

    togglePanel(
        "layerPanel",
        this
    );

};


// =====================================
// PLACE LAYER
// =====================================

document
.getElementById("placeCheck")
.onchange = function(){

    if(window.placeLayer){

        window.placeLayer.setVisible(
            this.checked
        );

    }

};


// =====================================
// AIRPORT LAYER
// =====================================

document
.getElementById("airportCheck")
.onchange = function(){

    if(window.airportLayer){

        window.airportLayer.setVisible(
            this.checked
        );

    }

};


// =====================================
// PORT LAYER
// =====================================

document
.getElementById("portCheck")
.onchange = function(){

    if(window.portLayer){

        window.portLayer.setVisible(
            this.checked
        );

    }

};


// =====================================
// ROAD LAYER
// =====================================

document
.getElementById("roadCheck")
.onchange = function(){

    if(window.roadLayer){

        window.roadLayer.setVisible(
            this.checked
        );

    }

};


// =====================================
// RIVER LAYER
// =====================================

document
.getElementById("riverCheck")
.onchange = function(){

    if(window.riverLayer){

        window.riverLayer.setVisible(
            this.checked
        );

    }

};