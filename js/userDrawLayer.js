// =====================================
// VAANAM USER DRAW TREE
// PART 1
// =====================================


// =====================================
// ROOT STORAGE
// =====================================

const drawRoots = {};

const drawTypes = {};


// =====================================
// START
// =====================================

document.addEventListener(

    "DOMContentLoaded",

    function(){

        initUserDrawTree();

    }

);


// =====================================
// INIT TREE
// =====================================

function initUserDrawTree(){

    const list =

    document.getElementById(

        "userLayerList"

    );

    if(!list){

        return;

    }

    list.innerHTML = "";

    createRoot("Point");

    createRoot("Line");

    createRoot("Polygon");

}


// =====================================
// CREATE ROOT
// =====================================

function createRoot(name){

    const list =

    document.getElementById(

        "userLayerList"

    );


    const root =

    document.createElement(

        "div"

    );

    root.className =

    "drawRoot";


    // ==========================
    // HEADER
    // ==========================

    const header =

    document.createElement(

        "div"

    );

    header.className =

    "drawRootHeader";


    const arrow =

    document.createElement(

        "span"

    );

    arrow.innerHTML = "▶";

    arrow.style.marginRight = "6px";


    const text =

    document.createElement(

        "span"

    );

    text.innerHTML = name;


    header.appendChild(

        arrow

    );

    header.appendChild(

        text

    );


    // ==========================
    // BODY
    // ==========================

    const body =

    document.createElement(

        "div"

    );

    body.className =

    "drawRootBody";

    body.style.display =

    "none";


    // ==========================
    // EXPAND
    // ==========================

    header.onclick = function(){

        if(body.style.display==="none"){

            body.style.display="block";

            arrow.innerHTML="▼";

        }

        else{

            body.style.display="none";

            arrow.innerHTML="▶";

        }

    };


    root.appendChild(

        header

    );

    root.appendChild(

        body

    );

    list.appendChild(

        root

    );


    drawRoots[name] = body;

    drawTypes[name] = {};

}

// =====================================
// ADD DRAW TYPE
// =====================================

window.addDrawType=function(

    geometry,
    type

){

    if(!drawTypes[geometry]){

        drawTypes[geometry]={};

    }

    if(drawTypes[geometry][type]){

        return;

    }

    const root=drawRoots[geometry];

    if(!root){

        console.log("Root Missing :",geometry);

        return;

    }


    // =====================================
    // CONTAINER
    // =====================================

    const container=document.createElement("div");


    // =====================================
    // HEADER
    // =====================================

    const header=document.createElement("div");

    header.className="layerItem";

    header.style.marginLeft="18px";


    // Arrow

    const arrow=document.createElement("span");

    arrow.innerHTML="▶";

    arrow.style.cursor="pointer";

    arrow.style.marginRight="6px";


    // Checkbox

    const check=document.createElement("input");

    check.type="checkbox";

    check.checked=true;


    // Text

    const text=document.createElement("span");

    text.textContent=type;


    header.appendChild(arrow);

    header.appendChild(check);

    header.appendChild(text);


    // =====================================
    // BODY
    // =====================================

    const body=document.createElement("div");

    body.style.display="none";

    body.style.marginLeft="20px";


    arrow.onclick=function(){

        if(body.style.display==="none"){

            body.style.display="block";

            arrow.innerHTML="▼";

        }

        else{

            body.style.display="none";

            arrow.innerHTML="▶";

        }

    };


    container.appendChild(header);

    container.appendChild(body);

    root.appendChild(container);


    // =====================================
    // SAVE BODY
    // =====================================

    drawTypes[geometry][type]=body;

    console.log("TYPE CREATED",geometry,type);

};



// =====================================
// ADD DRAW FEATURE
// =====================================

window.addDrawFeature = function(

    geometry,

    type,

    feature

){

    addDrawType(

        geometry,

        type

    );

};