// =====================================
// VAANAM GeoTIFF Writer
// =====================================

class GeoTIFFWriter {

    constructor(raster){

        this.data = raster.data;
        this.width = raster.width;
        this.height = raster.height;
        this.extent = raster.extent;
        this.projection = raster.projection;

    }

    save(){

        console.log("Preparing GeoTIFF...");
        console.log(this.width, this.height);
        console.log(this.data.length);

    }

}

window.GeoTIFFWriter = GeoTIFFWriter;