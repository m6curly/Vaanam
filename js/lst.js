// =====================================
// LST EXPORT VARIABLES
// =====================================

window.lstData = null;
window.lstWidth = 0;
window.lstHeight = 0;
window.lstExtent = null;
window.lstProjection = null;

// =====================================
// REGISTER UTM PROJECTION
// =====================================

proj4.defs(
    "EPSG:32643",
    "+proj=utm +zone=43 +datum=WGS84 +units=m +no_defs"
);

ol.proj.proj4.register(proj4);

// =====================================
// OPEN LST PANEL
// =====================================

document
.getElementById(
    "lstTool"
)
.onclick = function(){

    closeAllPanels();

    document
    .getElementById(
        "lstPanel"
    )
    .style.display =
    "block";

};


// =====================================
// FILE VARIABLES
// =====================================

let lstBand10 = null;
let lstBand5 = null;
let lstBand4 = null;
let lstMTL = null;


// =====================================
// FILE INPUTS
// =====================================

document
.getElementById(
    "lstBand10"
)
.onchange = function(e){

    lstBand10 =
    e.target.files[0];

};


document
.getElementById(
    "lstBand5"
)
.onchange = function(e){

    lstBand5 =
    e.target.files[0];

};


document
.getElementById(
    "lstBand4"
)
.onchange = function(e){

    lstBand4 =
    e.target.files[0];

};


document
.getElementById(
    "lstMTL"
)
.onchange = function(e){

    lstMTL =
    e.target.files[0];

};


// =====================================
// CALCULATE BUTTON
// =====================================

document
.getElementById(
    "calculateLST"
)
.onclick = function(){

    if(
        !lstBand10 ||
        !lstBand5 ||
        !lstBand4 ||
        !lstMTL
    ){

        alert(
            "Select all files"
        );

        return;

    }

    calculateUniversalLST();

};


// =====================================
// READ MTL
// =====================================

async function readMTL(file){

    return await file.text();

}


// =====================================
// UNIVERSAL LST
// =====================================

async function calculateUniversalLST(){

    try{

        // =====================
        // READ MTL
        // =====================

        const mtlText =
        await readMTL(
            lstMTL
        );

        alert(
            "MTL loaded"
        );


        // =====================
        // EXTRACT PARAMETERS
        // =====================

        const ML =
        parseFloat(

            mtlText.match(
                /RADIANCE_MULT_BAND_10\s=\s([0-9.E\-]+)/
            )[1]

        );

        const AL =
        parseFloat(

            mtlText.match(
                /RADIANCE_ADD_BAND_10\s=\s([0-9.E\-]+)/
            )[1]

        );

        const K1 =
        parseFloat(

            mtlText.match(
                /K1_CONSTANT_BAND_10\s=\s([0-9.E\-]+)/
            )[1]

        );

        const K2 =
        parseFloat(

            mtlText.match(
                /K2_CONSTANT_BAND_10\s=\s([0-9.E\-]+)/
            )[1]

        );


        // =====================
        // BAND10
        // =====================

        const thermalTiff =
        await GeoTIFF.fromBlob(
            lstBand10
        );

        const thermalImage =
        await thermalTiff.getImage();

console.log(
    thermalImage.getGeoKeys()
);

console.log(
    thermalImage.getBoundingBox()
);


        const thermalRaster =
        await thermalImage.readRasters();

        const DN =
        thermalRaster[0];


        // =====================
        // RADIANCE
        // =====================

        const radiance =
        new Float32Array(
            DN.length
        );

        for(
            let i=0;
            i<DN.length;
            i++
        ){

            radiance[i] =

                ML *
                DN[i]

                +

                AL;

        }


        // =====================
        // BRIGHTNESS TEMP
        // =====================

        const BT =
        new Float32Array(
            DN.length
        );

        for(
            let i=0;
            i<DN.length;
            i++
        ){

            BT[i] =

                K2 /

                Math.log(

                    (K1 /
                    radiance[i])

                    + 1

                );

        }

        alert(
            "Brightness Temperature calculated"
        );


        // =====================
        // BAND5
        // =====================

        const nirTiff =
        await GeoTIFF.fromBlob(
            lstBand5
        );

        const nirImage =
        await nirTiff.getImage();

        const nirRaster =
        await nirImage.readRasters();

        const NIR =
        nirRaster[0];


        // =====================
        // BAND4
        // =====================

        const redTiff =
        await GeoTIFF.fromBlob(
            lstBand4
        );

        const redImage =
        await redTiff.getImage();

        const redRaster =
        await redImage.readRasters();

        const RED =
        redRaster[0];


        // =====================
        // NDVI
        // =====================

        const NDVI =
        new Float32Array(
            RED.length
        );

        for(
            let i=0;
            i<RED.length;
            i++
        ){

            const sum =

                NIR[i]
                +
                RED[i];

            NDVI[i] =

                sum===0

                ?

                -9999

                :

                (

                    NIR[i]
                    -
                    RED[i]

                )

                /

                sum;

        }


        // =====================
        // NDVI MIN MAX
        // =====================

        let ndviMin =
        999;

        let ndviMax =
        -999;

        for(
            let i=0;
            i<NDVI.length;
            i++
        ){

            const v =
            NDVI[i];

            if(
                v>-1 &&
                v<1
            ){

                if(v<ndviMin)
                    ndviMin=v;

                if(v>ndviMax)
                    ndviMax=v;

            }

        }


        // =====================
        // Pv
        // =====================

        const Pv =
        new Float32Array(
            NDVI.length
        );

        for(
            let i=0;
            i<NDVI.length;
            i++
        ){

            Pv[i] =

                Math.pow(

                    (

                        NDVI[i]
                        -
                        ndviMin

                    )

                    /

                    (

                        ndviMax
                        -
                        ndviMin

                    ),

                    2

                );

        }


        // =====================
        // EMISSIVITY
        // =====================

        const emissivity =
        new Float32Array(
            NDVI.length
        );

        for(
            let i=0;
            i<NDVI.length;
            i++
        ){

            emissivity[i] =

                0.004 *
                Pv[i]

                +

                0.986;

        }


        // =====================================
        // FINAL LST
        // =====================================

        const LST =
        new Float32Array(
            BT.length
        );

        const lambda =
        10.895e-6;

        const rho =
        1.438e-2;

        for(

            let i=0;
            i<BT.length;
            i++

        ){

            // Invalid pixels
            if(

                DN[i]===0 ||

                radiance[i]<=0 ||

                emissivity[i]<=0 ||

                isNaN(BT[i])

            ){

                LST[i]=NaN;

                continue;

            }

            LST[i] =

                BT[i]

                /

                (

                    1 +

                    (

                        lambda *
                        BT[i]

                        /

                        rho

                    )

                    *

                    Math.log(

                        emissivity[i]

                    )

                )

                -

                273.15;

        }

        // =====================
        // MIN MAX
        // =====================

        let lstMin = 9999;
        let lstMax = -9999;

        for(

            let i=0;
            i<LST.length;
            i++

        ){

            const v =
            LST[i];

            if(

                isNaN(v) ||

                v<-30 ||

                v>80

            ){

                continue;

            }

            if(v<lstMin)
                lstMin=v;

            if(v>lstMax)
                lstMax=v;

        }

        console.log(
            "LST",
            LST
        );

        console.log(
            "MIN",
            lstMin
        );

        console.log(
            "MAX",
            lstMax
        );

        alert(

            "LST Range : "

            +

            lstMin.toFixed(1)

            +

            " °C to "

            +

            lstMax.toFixed(1)

            +

            " °C"

        );


        // =====================================
        // CREATE CANVAS
        // =====================================

        const width =
        thermalImage.getWidth();

        const height =
        thermalImage.getHeight();

        // =====================================
// SAVE LST DATA FOR EXPORT
// =====================================

window.lstData = LST;

window.lstWidth = width;

window.lstHeight = height;

window.lstBBox = thermalImage.getBoundingBox();

window.lstProjection = "EPSG:32643";


        const canvas =
        document.createElement(
            "canvas"
        );

        canvas.width =
        width;

        canvas.height =
        height;

        const ctx =
        canvas.getContext(
            "2d"
        );

        const img =
        ctx.createImageData(
            width,
            height
        );

        const pixels =
        img.data;
        

        // =====================================
        // COLOR RAMP
        // =====================================

        for(

            let i=0;
            i<LST.length;
            i++

        ){

            let v =
            LST[i];

            const p =
            i*4;

            if(

                isNaN(v)

            ){

                pixels[p+3]=0;

                continue;

            }

            if(v<0)
                v=0;

            if(v>50)
                v=50;

            const r =
            Math.floor(

                255*
                (v/50)

            );

            const b =
            255-r;

            pixels[p]=r;

            pixels[p+1]=0;

            pixels[p+2]=b;

            pixels[p+3]=255;

        }

        ctx.putImageData(

            img,

            0,

            0

        );

        console.log(
            "Canvas Ready"
        );

        alert(
            "Canvas Created"
        );


// =====================================
// CANVAS TO IMAGE URL
// =====================================

const imageURL =
canvas.toDataURL(
    "image/png"
);

// =====================================
// REAL GEOGRAPHIC EXTENT
// =====================================

const bbox = thermalImage.getBoundingBox();

const extent = ol.proj.transformExtent(
    bbox,
    "EPSG:32643",
    "EPSG:3857"
);

window.lstData = LST;

window.lstWidth = width;

window.lstHeight = height;

window.lstExtent = extent;

window.lstProjection = "EPSG:3857";

console.log(extent);

console.log("Extent:", extent);

console.log(
    "Extent",
    extent
);

// =====================================
// IMAGE SOURCE
// =====================================

const lstSource =

new ol.source.ImageStatic({

    url:
    imageURL,

    imageExtent:
    extent,

    projection: "EPSG:3857"

});

// =====================================
// REMOVE OLD LST
// =====================================

if(window.lstLayer){

    map.removeLayer(
        window.lstLayer
    );

}

// =====================================
// CREATE LST LAYER
// =====================================

window.lstLayer =

new ol.layer.Image({

    source:
    lstSource,

    opacity:0.75

});

window.lstLayer.set(
    "type",
    "LST"
);

map.addLayer(

    window.lstLayer

);

// =====================================
// ADD TO USER LAYER
// =====================================

addUserLayer(

    "LST",

    window.lstLayer

);

// =====================================
// STORE LST DATA
// =====================================

window.lstRaster = {

    data: LST,

    width: width,

    height: height,

    extent: extent,

    projection: "EPSG:3857"

};

console.log(window.lstRaster);

console.log("Extent:", extent);

map.getView().fit(
    extent,
    {
        duration:1000
    }
);

alert(

    "LST Added To Map"

);

    }



    catch(error){

        console.error(
            error
        );

        alert(
            "LST Error"
        );

    }

}