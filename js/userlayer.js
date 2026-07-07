// =====================================
// USER LAYER
// =====================================

window.addUserLayer =
function(

    layerName,
    layer

){

    const list =

    document
    .getElementById(
        "userLayerList"
    );

    const item =
    document.createElement(
        "div"
    );

    item.className =
    "layerItem";

    item.layerObject =
    layer;


    // checkbox

    const checkbox =
    document.createElement(
        "input"
    );

    checkbox.type =
    "checkbox";

    checkbox.checked =
    true;

    checkbox.onchange =
    function(){

        layer.setVisible(
            this.checked
        );

    };


    // label

    const label =
    document.createElement(
        "label"
    );

    label.innerText =
    layerName;


    // style

    const styleBtn =
    document.createElement(
        "button"
    );

    styleBtn.className =
    "styleButton";

    styleBtn.innerHTML =
    "🎨";

    styleBtn.onclick =
    function(){

        openStylePanel(
            layer
        );

    };


// EXPORT BUTTON

const exportBtn =
document.createElement(
    "button"
);

exportBtn.innerHTML =
"💾";

exportBtn.title =
"Export Layer";

exportBtn.onclick =
function(){

    if(layer.get("type")==="LST"){

        exportLST();

    }

    else{

        alert(
            "Export not available for this layer"
        );

    }

};

    // remove

    const removeBtn =
    document.createElement(
        "button"
    );

    removeBtn.innerHTML =
    "🗑";

    removeBtn.onclick =
    function(){

        map.removeLayer(
            layer
        );

        item.remove();

    };


    item.appendChild(
        checkbox
    );

    item.appendChild(
        label
    );

    item.appendChild(
        styleBtn
    );

item.appendChild(
    exportBtn
);

    item.appendChild(
        removeBtn
    );


    list.appendChild(
        item
    );

}


// =====================================
// SORTABLE
// =====================================

new Sortable(

    document.getElementById(
        "userLayerList"
    ),

    {

        animation:150,

        ghostClass:
        "dragGhost",

        chosenClass:
        "dragChosen",

        dragClass:
        "dragItem",

        onEnd:
        function(){

            updateLayerOrder();

        }

    }

);


// =====================================
// UPDATE ORDER
// =====================================

function updateLayerOrder(){

    const items =

    Array.from(

        document.querySelectorAll(

            "#userLayerList .layerItem"

        )

    );

    items.forEach(

        function(
            item,
            index
        ){

            item
            .layerObject
            .setZIndex(

                items.length
                -
                index

            );

        }

    );

}