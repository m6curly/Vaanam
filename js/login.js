// =====================================
// LOGIN PANEL
// =====================================

const loginPanel =
document.getElementById(
    "loginPanel"
);


// OPEN/CLOSE

document
.getElementById(
    "loginBtn"
)
.onclick=function(e){

    e.preventDefault();

    if(
        loginPanel
        .style.display
        ===
        "block"
    ){

        loginPanel
        .style.display =
        "none";

    }
    else{

        loginPanel
        .style.display =
        "block";

    }

};


// CLOSE BUTTON

document
.getElementById(
    "loginClose"
)
.onclick=function(){

    loginPanel
    .style.display =
    "none";

};


// LOGIN

document
.getElementById(
    "loginSubmit"
)
.onclick=function(){

    const user =
    document
    .getElementById(
        "username"
    )
    .value;

    const pass =
    document
    .getElementById(
        "password"
    )
    .value;

    if(

        user==="admin"

        &&

        pass==="vannam123"

    ){

        document
        .getElementById(
            "loginMessage"
        )
        .innerHTML=

        "✅ Login Successful";

    }
    else{

        document
        .getElementById(
            "loginMessage"
        )
        .innerHTML=

        "❌ Invalid Login";

    }

};