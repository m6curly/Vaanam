// =====================================
// EXPORT CURRENT VIEW
// =====================================

document
.getElementById(
    "exportBtn"
)
.onclick = function(){

    const panels = document.querySelectorAll(
        "#sidebar,#toolbar,#popup"
    );

    panels.forEach(function(p){

        p.dataset.old =
        p.style.display;

        p.style.display =
        "none";

    });

    html2canvas(

        document.getElementById(
            "map"
        ),

        {
            useCORS:true,
            allowTaint:true,
            scale:2
        }

    )

    .then(function(canvas){

        const link =
        document.createElement(
            "a"
        );

        link.download =
        "VAANAM_Map.png";

        link.href =
        canvas.toDataURL(
            "image/png"
        );

        link.click();

        panels.forEach(function(p){

            p.style.display =
            p.dataset.old;

        });

    });

};


// =====================================
// EXPORT LST AS FLOAT BINARY
// =====================================

window.exportLST = function () {

    if (!window.lstRaster) {

        alert("No LST available");

        return;

    }

    const raster = window.lstRaster;

    const blob = new Blob(

        [raster.data.buffer],

        {
            type: "application/octet-stream"
        }

    );

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);

    link.download = "LST.float32";

    link.click();

    URL.revokeObjectURL(link.href);

};