// =====================================
// TOOLS PANEL
// =====================================

document
.getElementById(
    "toolsBtn"
)
.onclick = function(e){

    e.preventDefault();

    e.stopPropagation();

    togglePanel(
        "toolsPanel",
        this
    );

};