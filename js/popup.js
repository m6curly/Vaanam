const popup=
document
.getElementById(
    "popup"
);

map.on(

    "singleclick",

    function(evt){

        const feature=
        map.forEachFeatureAtPixel(

            evt.pixel,

            function(f){

                return f;

            }

        );

        if(!feature)return;

        const props=
        feature.getProperties();

        delete props.geometry;

        let html="";

        for(let k in props){

            html+=

            "<b>"+k+
            "</b>: "+
            props[k]+
            "<br>";

        }

        popup.innerHTML=
        html;

        popup.style.left=
        evt.pixel[0]+"px";

        popup.style.top=
        evt.pixel[1]+"px";

        popup.style.display=
        "block";

    }

);