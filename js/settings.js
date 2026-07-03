document
.getElementById(
    "settingsBtn"
)
.onclick=function(){

    const panel =
    document.getElementById(
        "settingsPanel"
    );

    if(
        panel.style.display
        === "block"
    ){

        panel.style.display =
        "none";
    }
    else{

        panel.style.display =
        "block";
    }
};

document
.getElementById(
    "applyProjection"
)
.onclick=function(){

    const epsg =

        document
        .getElementById(
            "projectionSelect"
        )
        .value;

    const center =

        ol.proj.transform(

            view.getCenter(),

            view
            .getProjection(),

            epsg

        );

    const newView =

        new ol.View({

            projection:
                epsg,

            center:
                center,

            zoom:
                view.getZoom()

        });

    map.setView(
        newView
    );

    document
    .getElementById(
        "projectionText"
    )
    .innerHTML =
        epsg;
};

// =====================================
// CLOSE PANEL
// =====================================
settingsBtn.onclick=function(){

    closeAllPanels();

    settingsPanel.style.display=
    "block";

};