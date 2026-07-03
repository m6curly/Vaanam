// =====================================
// FEEDBACK PANEL
// =====================================

const feedbackPanel =
document.getElementById(
    "feedbackPanel"
);


// OPEN/CLOSE

document
.getElementById(
    "feedbackBtn"
)
.onclick=function(e){

    e.preventDefault();

    if(
        feedbackPanel
        .style.display
        ===
        "block"
    ){

        feedbackPanel
        .style.display =
        "none";

    }
    else{

        feedbackPanel
        .style.display =
        "block";

    }

};


// CLOSE BUTTON

document
.getElementById(
    "closeFeedback"
)
.onclick=function(){

    feedbackPanel
    .style.display =
    "none";

};