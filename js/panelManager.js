// =====================================
// ALL PANELS
// =====================================

const PANELS = [

    "downloadsPanel",
    "feedbackPanel",
    "aboutPanel",
    "loginPanel",

    "drawPanel",
    "stylePanel",
    "basemapPanel",

    "toolsPanel",
    "measurePanel",
    "settingsPanel",

    "bufferPopup"

];


// =====================================
// CLOSE ALL PANELS
// =====================================

function closeAllPanels(){

    PANELS.forEach(

        function(id){

            const panel =

                document
                .getElementById(id);

            if(panel){

                panel.style.display =
                    "none";

            }

        }

    );

}


// =====================================
// TOGGLE PANEL
// =====================================

function togglePanel(id){

    const panel =

        document
        .getElementById(id);

    if(!panel)
        return;

    const isOpen =

        panel.style.display
        ===
        "block";

    closeAllPanels();

    if(!isOpen){

        panel.style.display =
            "block";

    }

}


// =====================================
// CLICK OUTSIDE CLOSE
// =====================================

document.addEventListener(

    "click",

    function(e){

        const inside =

            e.target.closest(

                "#downloadsPanel,\
                #feedbackPanel,\
                #aboutPanel,\
                #loginPanel,\
                #drawPanel,\
                #layerPanel,\
                #stylePanel,\
                #basemapPanel,\
                #toolsPanel,\
                #measurePanel,\
                #settingsPanel,\
                #bufferPopup"

            );

        const button =

            e.target.closest(
                "button,a"
            );

        if(
            !inside &&
            !button
        ){

            closeAllPanels();

        }

    }

);