// =====================================
// LOGIN PANEL
// =====================================

const loginBtn =
document.getElementById(
    "loginBtn"
);


// =====================================
// TOGGLE LOGIN PANEL
// =====================================

loginBtn.onclick = function(e){

    e.preventDefault();

    e.stopPropagation();

    togglePanel(
        "loginPanel",
        this
    );

};


// =====================================
// CLOSE BUTTON
// =====================================

document
.getElementById(
    "loginClose"
)
.onclick = function(){

    closePanel(
        "loginPanel"
    );

};


// =====================================
// LOGIN
// =====================================

document
.getElementById(
    "loginSubmit"
)
.onclick = function(){

    const user =
    document
    .getElementById(
        "username"
    )
    .value
    .trim();

    const pass =
    document
    .getElementById(
        "password"
    )
    .value
    .trim();

    const message =
    document.getElementById(
        "loginMessage"
    );

    if(
        user === "admin" &&
        pass === "vannam123"
    ){

        message.innerHTML =
        "✅ Login Successful";

    }
    else{

        message.innerHTML =
        "❌ Invalid Login";

    }

};


// =====================================
// PREVENT PANEL CLICK
// =====================================

document
.getElementById(
    "loginPanel"
)
.onclick = function(e){

    e.stopPropagation();

};