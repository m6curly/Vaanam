// =====================================
// ABOUT PANEL
// =====================================

const aboutPanel =
document.getElementById(
    "aboutPanel"
);

let aboutTimer;


// =====================================
// OPEN/CLOSE
// =====================================

document
.getElementById(
    "aboutBtn"
)
.onclick=function(e){

    e.preventDefault();

    if(
        aboutPanel
        .style.display
        ===
        "block"
    ){

        aboutPanel
        .style.display =
        "none";

    }
    else{

        aboutPanel
        .style.display =
        "block";

    }

};