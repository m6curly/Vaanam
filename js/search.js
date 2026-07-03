// =====================================
// SEARCH FUNCTION
// =====================================

async function searchLocation(){

    const input =
    document
    .getElementById(
        "searchBox"
    )
    .value
    .trim();

    if(input===""){

        return;

    }

    // remove old marker

    searchSource.clear();

    // =================================
    // LAT,LON SEARCH
    // =================================

    if(input.includes(",")){

        const parts =
        input.split(",");

        if(parts.length===2){

            const lat =
            parseFloat(parts[0]);

            const lon =
            parseFloat(parts[1]);

                if(
                    !isNaN(lat)
                    &&
                    !isNaN(lon)
                    &&
                    lat>=-90
                    &&
                    lat<=90
                    &&
                    lon>=-180
                    &&
                    lon<=180
                ){

                const coord =
                ol.proj.fromLonLat(

                    [lon,lat]

                );

                searchSource
                .addFeature(

                    new ol.Feature({

                        geometry:
                        new ol.geom.Point(
                            coord
                        )

                    })

                );

                view.setCenter(
                    coord
                );

                view.setZoom(
                    15
                );

                return;
            }
        }
    }

    // =================================
    // PLACE SEARCH
    // =================================

    try{

        const url =

        "https://nominatim.openstreetmap.org/search?format=json&limit=1&q="

        +

        encodeURIComponent(
            input
        );

        const response =
        await fetch(url);

        const data =
        await response.json();

        if(data.length>0){

            const lon =
            parseFloat(
                data[0].lon
            );

            const lat =
            parseFloat(
                data[0].lat
            );

            const coord =
            ol.proj.fromLonLat(

                [lon,lat]

            );

            searchSource
            .addFeature(

                new ol.Feature({

                    geometry:
                    new ol.geom.Point(
                        coord
                    )

                })

            );

            view.setCenter(
                coord
            );

            view.setZoom(
                12
            );

        }
        else{

            alert(
                "Location not found"
            );

        }

    }
    catch(error){

        alert(
            "Location not found"
        );

    }

}


// =====================================
// ENTER KEY
// =====================================

document
.getElementById(
    "searchBox"
)
.addEventListener(

    "keydown",

    function(e){

        if(
            e.key==="Enter"
        ){

            searchLocation();

        }

    }

);