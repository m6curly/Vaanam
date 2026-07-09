// =====================================
// ABOUT PANEL
// =====================================

const aboutBtn =
document.getElementById(
    "aboutBtn"
);


// =====================================
// TOGGLE ABOUT PANEL
// =====================================

aboutBtn.onclick = function(e){

    e.preventDefault();

    e.stopPropagation();

    togglePanel(
        "aboutPanel",
        this
    );

};


// =====================================
// PREVENT PANEL CLICK
// =====================================

document
.getElementById(
    "aboutPanel"
)
.onclick = function(e){

    e.stopPropagation();

};