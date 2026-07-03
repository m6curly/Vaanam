// =====================================
// EXPORT CURRENT MAP AS IMAGE
// =====================================

document
.getElementById(
    "exportBtn"
)
.onclick = function(){

    map.once(

        "rendercomplete",

        function(){

            const exportCanvas =
            document.createElement(
                "canvas"
            );

            const size =
            map.getSize();

            exportCanvas.width =
            size[0];

            exportCanvas.height =
            size[1];

            const context =
            exportCanvas.getContext(
                "2d"
            );

            document
            .querySelectorAll(
                ".ol-layer canvas"
            )
            .forEach(function(canvas){

                if(canvas.width>0){

                    const opacity =
                    canvas.parentNode
                    .style.opacity;

                    context.globalAlpha =

                    opacity === ""
                    ?
                    1
                    :
                    Number(opacity);

                    context.drawImage(
                        canvas,
                        0,
                        0
                    );

                }

            });

            const link =
            document.createElement(
                "a"
            );

            link.download =
            "VAANAM_Map.png";

            link.href =
            exportCanvas.toDataURL(
                "image/png"
            );

            link.click();

        }

    );

    map.renderSync();

};