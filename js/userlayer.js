// =====================================
// ADD USER LAYER
// =====================================

window.addUserLayer = function (

    layerName,
    layer

) {

    const list =
    document.getElementById(
        "userLayerList"
    );

    if (!list)
        return;

    const item =
    document.createElement(
        "div"
    );

    item.className =
    "layerItem";

    item.layerObject =
    layer;


    // =====================================
    // VISIBILITY
    // =====================================

    const checkbox =
    document.createElement(
        "input"
    );

    checkbox.type =
    "checkbox";

    checkbox.checked =
    true;

    checkbox.onchange = function () {

        layer.setVisible(
            this.checked
        );

    };


    // =====================================
    // LABEL
    // =====================================

    const label =
    document.createElement(
        "label"
    );

    label.textContent =
    layerName;


    // =====================================
    // STYLE BUTTON
    // =====================================

    const styleBtn =
    document.createElement(
        "button"
    );

    styleBtn.className =
    "styleButton";

    styleBtn.innerHTML =
    "🎨";

    styleBtn.onclick =
    function () {

        if (
            typeof openStylePanel ===
            "function"
        ) {

            openStylePanel(
                layer
            );

        }

    };


    // =====================================
    // EXPORT BUTTON
    // =====================================

    const exportBtn =
    document.createElement(
        "button"
    );

    exportBtn.innerHTML =
    "💾";

    exportBtn.title =
    "Export Layer";

    exportBtn.onclick =
    function () {

        if (

            layer.get("type") ===
            "LST"

        ) {

            if (
                typeof exportLST ===
                "function"
            ) {

                exportLST();

            }

        }

        else {

            alert(
                "Export not available for this layer."
            );

        }

    };


    // =====================================
    // REMOVE BUTTON
    // =====================================

    const removeBtn =
    document.createElement(
        "button"
    );

    removeBtn.innerHTML =
    "🗑";

    removeBtn.title =
    "Remove Layer";

    removeBtn.onclick =
    function () {

        map.removeLayer(
            layer
        );

        item.remove();

    };


    // =====================================
    // ADD CONTROLS
    // =====================================

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

};


// =====================================
// SORTABLE
// =====================================

const userLayerList =
document.getElementById(
    "userLayerList"
);

if (userLayerList) {

    new Sortable(

        userLayerList,

        {

            animation: 150,

            ghostClass:
            "dragGhost",

            chosenClass:
            "dragChosen",

            dragClass:
            "dragItem",

            onEnd:
            updateLayerOrder

        }

    );

}


// =====================================
// UPDATE Z ORDER
// =====================================

function updateLayerOrder() {

    const items =

    Array.from(

        document.querySelectorAll(

            "#userLayerList .layerItem"

        )

    );

    items.forEach(

        function (

            item,
            index

        ) {

            if (

                item.layerObject

            ) {

                item.layerObject.setZIndex(

                    items.length - index

                );

            }

        }

    );

}