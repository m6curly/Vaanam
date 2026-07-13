// =====================================
// VAANAM PANEL MANAGER
// =====================================

let activePanel = null;


// =====================================
// INITIALIZE
// =====================================

document.addEventListener(

    "DOMContentLoaded",

    function(){

        document
        .querySelectorAll(".panel")
        .forEach(function(panel){

            panel.style.display = "none";

            panel.classList.remove(
                "show",
                "hide"
            );

            panel.onclick = function(e){

                e.stopPropagation();

            };

        });

    }

);


// =====================================
// OPEN PANEL
// =====================================

function openPanel(id){

    const panel =
    document.getElementById(id);

    if(!panel) return;


    if(

        activePanel &&

        activePanel !== panel

    ){

        const allowed =

            (activePanel.id==="layerPanel" && id==="stylePanel")

            ||

            (activePanel.id==="stylePanel" && id==="layerPanel");

        if(!allowed){

            closePanel(
                activePanel.id
            );

        }

    }

    panel.style.display = "block";

    panel.classList.remove(
        "hide"
    );

    requestAnimationFrame(function(){

        panel.classList.add(
            "show"
        );

    });

    activePanel = panel;

}


// =====================================
// CLOSE PANEL
// =====================================

function closePanel(id){

    const panel =
    document.getElementById(id);

    if(!panel) return;

    panel.classList.remove(
        "show"
    );

    panel.classList.add(
        "hide"
    );

    setTimeout(function(){

        panel.style.display =
        "none";

        panel.classList.remove(
            "hide"
        );

    },250);

    if(activePanel===panel){

        activePanel = null;

    }

}


// =====================================
// TOGGLE PANEL
// =====================================

function togglePanel(id){

    const panel =
    document.getElementById(id);

    if(!panel) return;

    if(panel.style.display==="block"){

        closePanel(id);

    }

    else{

        openPanel(id);

    }

}


// =====================================
// CLOSE ALL
// =====================================

function closeAllPanels(){

    document
    .querySelectorAll(".panel")
    .forEach(function(panel){

        if(

            panel.id==="drawPanel" ||

            panel.id==="layerPanel"

        ){

            return;

        }

        if(panel.style.display==="block"){

            closePanel(
                panel.id
            );

        }

    });

}


// =====================================
// ESC KEY
// =====================================

document.addEventListener(

    "keydown",

    function(e){

        if(e.key==="Escape"){

            closeAllPanels();

        }

    }

);


// =====================================
// CLICK OUTSIDE
// =====================================

document.addEventListener(

    "click",

    function(e){

        if(

            e.target.closest(".panel")

        ){

            return;

        }

        if(

            e.target.closest("button") ||

            e.target.closest("a")

        ){

            return;

        }

        document
        .querySelectorAll(".panel")
        .forEach(function(panel){

            // Never auto close these panels

            if(

                panel.id==="drawPanel" ||

                panel.id==="layerPanel" ||

                panel.id==="featurePopup"

            ){

                return;

            }

            if(

                panel.style.display==="block"

            ){

                closePanel(

                    panel.id

                );

            }

        });

    }

);