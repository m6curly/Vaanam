// =====================================
// VAANAM PANEL MANAGER
// =====================================

let activePanel = null;


// =====================================
// INITIALIZE
// =====================================

document.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll(".panel").forEach(panel => {

        panel.style.display = "none";
        panel.classList.remove("show", "hide");

        panel.addEventListener("click", e => {
            e.stopPropagation();
        });

    });

});


// =====================================
// OPEN PANEL
// =====================================

function openPanel(id){

    const panel = document.getElementById(id);

    if(!panel) return;

    if(activePanel && activePanel !== panel){

        closePanel(activePanel.id);

    }

    panel.style.display = "block";

    panel.classList.remove("hide");

    requestAnimationFrame(() => {

        panel.classList.add("show");

    });

    activePanel = panel;

}


// =====================================
// CLOSE PANEL
// =====================================

function closePanel(id){

    const panel = document.getElementById(id);

    if(!panel) return;

    panel.classList.remove("show");

    panel.classList.add("hide");

    setTimeout(() => {

        panel.style.display = "none";

        panel.classList.remove("hide");

    },280);

    if(activePanel === panel){

        activePanel = null;

    }

}


// =====================================
// TOGGLE
// =====================================

function togglePanel(id){

    const panel = document.getElementById(id);

    if(!panel) return;

    if(panel.style.display === "block"){

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

    document.querySelectorAll(".panel").forEach(panel => {

        if(panel.style.display === "block"){

            closePanel(panel.id);

        }

    });

}


// =====================================
// ESC
// =====================================

document.addEventListener("keydown", e => {

    if(e.key === "Escape"){

        closeAllPanels();

    }

});


// =====================================
// CLICK OUTSIDE
// =====================================

document.addEventListener("click", e => {

    if(e.target.closest(".panel")) return;

    if(e.target.closest("button,a")) return;

    closeAllPanels();

});