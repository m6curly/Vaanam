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