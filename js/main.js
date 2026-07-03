// =====================================
// VAANAM LOGO = REFRESH WEBSITE
// =====================================

document
.getElementById(
    "logoHome"
)
.onclick=function(){

    location.reload();

};

// =====================================
// CLOSE ALL PANELS
// =====================================

function closeAllPanels(){

    const panels = [

        "downloadsPanel",
        "feedbackPanel",
        "aboutPanel",
        "loginPanel",

        "drawPanel",
        "layerPanel",
        "stylePanel",
        "basemapPanel",

        "toolsPanel",
        "measurePanel",
        "settingsPanel",

        "bufferPopup"
    ];

    panels.forEach(function(id){

        const panel =
        document.getElementById(id);

        if(panel){

            panel.style.display =
            "none";

        }

    });

}