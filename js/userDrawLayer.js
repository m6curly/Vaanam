// =====================================
// VAANAM USER DRAW TREE
// PART 1
// =====================================


// =====================================
// TREE STORAGE
// =====================================

const drawRoots = {};

const drawTypes = {};


// =====================================
// START
// =====================================

document.addEventListener(

    "DOMContentLoaded",

    initUserDrawTree

);


// =====================================
// INIT
// =====================================

function initUserDrawTree(){

    const list =

    document.getElementById(

        "userLayerList"

    );

    if(!list){

        return;

    }

    list.innerHTML="";

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

    root.className="drawRoot";


    // =====================================
    // HEADER
    // =====================================

    const header =

    document.createElement(

        "div"

    );

    header.className="drawRootHeader";

    header.innerHTML=

        '<span class="arrow">▶</span> '+name;


    // =====================================
    // BODY
    // =====================================

    const body =

    document.createElement(

        "div"

    );

    body.className="drawRootBody";

    body.style.display="none";


    // =====================================
    // EXPAND
    // =====================================

    header.onclick=function(){

        const arrow=

        header.querySelector(

            ".arrow"

        );

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


    drawRoots[name]=body;

    drawTypes[name]={};

}

// =====================================
// ADD DRAW TYPE
// =====================================

window.addDrawType = function(

    geometry,

    type

){

    // already exists

    if(

        drawTypes[geometry][type]

    ){

        return;

    }


    const parent =

    drawRoots[geometry];

    if(!parent){

        return;

    }


    // =====================================
    // TYPE CONTAINER
    // =====================================

    const container =

    document.createElement(

        "div"

    );

    container.className="drawType";


    // =====================================
    // HEADER
    // =====================================

    const header =

    document.createElement(

        "div"

    );

    header.className="layerItem";

    header.style.marginLeft="18px";


    // =====================================
    // EXPAND
    // =====================================

    const arrow =

    document.createElement(

        "span"

    );

    arrow.innerHTML="▶";

    arrow.style.cursor="pointer";

    arrow.style.marginRight="6px";


    // =====================================
    // CHECKBOX
    // =====================================

    const check =

    document.createElement(

        "input"

    );

    check.type="checkbox";

    check.checked=true;


    // =====================================
    // LABEL
    // =====================================

    const text =

    document.createElement(

        "span"

    );

    text.innerHTML=type;


    header.appendChild(

        arrow

    );

    header.appendChild(

        check

    );

    header.appendChild(

        text

    );


    // =====================================
    // FEATURE BODY
    // =====================================

    const body =

    document.createElement(

        "div"

    );

    body.style.display="none";

    body.style.marginLeft="18px";


    // =====================================
    // EXPAND
    // =====================================

    arrow.onclick=function(){

        if(

            body.style.display==="none"

        ){

            body.style.display="block";

            arrow.innerHTML="▼";

        }

        else{

            body.style.display="none";

            arrow.innerHTML="▶";

        }

    };


    // =====================================
    // TYPE VISIBILITY
    // =====================================

    check.onchange=function(){

        body

        .querySelectorAll(

            "input[type='checkbox']"

        )

        .forEach(function(box){

            box.checked=

            check.checked;

            box.dispatchEvent(

                new Event(

                    "change"

                )

            );

        });

    };


    container.appendChild(

        header

    );

    container.appendChild(

        body

    );

    parent.appendChild(

        container

    );


    drawTypes

    [geometry]

    [type]=body;

};

// =====================================
// ADD DRAW FEATURE
// =====================================

window.addDrawFeature = function(

    geometry,

    type,

    feature

){

    // =====================================
    // CREATE TYPE IF NOT EXISTS
    // =====================================

    addDrawType(

        geometry,

        type

    );

    const parent =

    drawTypes

    [geometry]

    [type];

    if(!parent){

        return;

    }


    // =====================================
    // FEATURE ROW
    // =====================================

    const row =

    document.createElement(

        "div"

    );

    row.className="featureItem";

    row.style.marginLeft="20px";


    // =====================================
    // FEATURE CHECKBOX
    // =====================================

    const check =

    document.createElement(

        "input"

    );

    check.type="checkbox";

    check.checked=true;


    // =====================================
    // FEATURE LABEL
    // =====================================

    const label =

    document.createElement(

        "span"

    );

    label.innerHTML=

        feature.get("name") ||

        "Unnamed";


    // =====================================
    // FEATURE VISIBILITY
    // =====================================

    check.onchange=function(){

        feature.setStyle(

            this.checked

            ?

            undefined

            :

            new ol.style.Style(null)

        );

    };


    row.appendChild(

        check

    );

    row.appendChild(

        label

    );

    parent.appendChild(

        row

    );

};