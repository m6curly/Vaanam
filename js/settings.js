// =====================================
// SETTINGS PANEL
// =====================================

document.addEventListener("DOMContentLoaded",function(){

    document.getElementById("settingsBtn").onclick=function(e){

        e.preventDefault();

        togglePanel("settingsPanel",this);

    };

});


// =====================================
// APPLY PROJECTION
// =====================================

document.getElementById("applyProjection").onclick=function(){

    const epsg=document.getElementById(
        "projectionSelect"
    ).value;

    const oldView=map.getView();

    const center=ol.proj.transform(

        oldView.getCenter(),

        oldView.getProjection(),

        epsg

    );

    const newView=new ol.View({

        projection:epsg,

        center:center,

        zoom:oldView.getZoom()

    });

    map.setView(newView);

    document.getElementById(
        "projectionText"
    ).textContent=epsg;

};