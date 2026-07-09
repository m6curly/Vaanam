// =====================================
// FEEDBACK PANEL
// =====================================

const feedbackBtn =
document.getElementById(
    "feedbackBtn"
);


// =====================================
// TOGGLE FEEDBACK PANEL
// =====================================

feedbackBtn.onclick = function(e){

    e.preventDefault();

    e.stopPropagation();

    togglePanel(
        "feedbackPanel",
        this
    );

};


// =====================================
// CLOSE BUTTON
// =====================================

document
.getElementById(
    "closeFeedback"
)
.onclick = function(){

    closePanel(
        "feedbackPanel"
    );

};


// =====================================
// PREVENT PANEL CLICK
// =====================================

document
.getElementById(
    "feedbackPanel"
)
.onclick = function(e){

    e.stopPropagation();

};