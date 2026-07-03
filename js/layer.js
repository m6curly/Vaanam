// =====================================
// LAYER PANEL
// =====================================

document
.getElementById("layerBtn")
.onclick = function(){

    const panel =
    document.getElementById(
        "layerPanel"
    );

    panel.style.display =

    panel.style.display==="block"

    ?

    "none"

    :

    "block";

};


// =====================================
// ADD LAYER TO PANEL
// =====================================

function addLayerToManager(

    layerName,
    layer

){

    const list =
    document.getElementById(
        "layerList"
    );


    const item =
    document.createElement(
        "div"
    );

    item.className =
    "layerItem";

    item.layerObject =
    layer;


    // =====================
    // CHECKBOX
    // =====================

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

            checkbox.checked

        );

    };


    // =====================
    // LABEL
    // =====================

    const label =
    document.createElement(
        "label"
    );

    label.innerText =
    layerName;


    // =====================
    // STYLE BUTTON
    // =====================

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


    // =====================
    // REMOVE BUTTON
    // =====================

    const removeBtn =
    document.createElement(
        "button"
    );

    removeBtn.className =
    "removeButton";

    removeBtn.innerHTML =
    "🗑";

    removeBtn.onclick =
    function(){

        map.removeLayer(
            layer
        );

        item.remove();

    };


    // =====================
    // ADD TO ITEM
    // =====================

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
        removeBtn
    );


    // NEW LAYER TOP
    list.prepend(
        item
    );

    updateLayerOrder();

}


// =====================================
// SORTABLE
// =====================================

new Sortable(

    document.getElementById(
        "layerList"
    ),

    {

        animation:150,

        ghostClass:
        "dragGhost",

        chosenClass:
        "dragChosen",

        dragClass:
        "dragItem",

        direction:
        "vertical",

        swapThreshold:
        0.15,

        invertSwap:
        true,

        onEnd:function(){

            updateLayerOrder();

        }

    }

);


// =====================================
// UPDATE LAYER ORDER
// =====================================

function updateLayerOrder(){

    const items =

    Array.from(

        document.querySelectorAll(

            "#layerList .layerItem"

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


// =====================================
// CLOSE PANEL
// =====================================

layerBtn.onclick=function(){

    closeAllPanels();

    layerPanel.style.display=
    "block";

};