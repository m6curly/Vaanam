// =====================================
// VAANAM FEATURE TYPES
// =====================================

const FEATURE_TYPES = [

    // =========================
    // AIR
    // =========================

    "Airport",
    "Airfield",
    "Air Base",
    "Air Force Station",
    "Civil Airport",
    "Military Airport",
    "Helipad",
    "Runway",
    "Taxiway",
    "Apron",
    "Hangar",
    "Aircraft Shelter",

    // =========================
    // MILITARY
    // =========================

    "Army Base",
    "Naval Base",
    "Military Camp",
    "Missile Site",
    "Radar Site",
    "SAM Site",
    "Artillery Position",
    "Bunker",
    "Observation Post",
    "Command Center",
    "Ammunition Depot",

    // =========================
    // RAILWAY
    // =========================

    "Railway Station",
    "Railway Junction",
    "Railway Yard",
    "Metro Station",
    "Rail Bridge",

    // =========================
    // ROAD
    // =========================

    "Bus Stand",
    "Bus Depot",
    "Highway",
    "Expressway",
    "Bridge",
    "Flyover",
    "Tunnel",
    "Toll Plaza",

    // =========================
    // PORT
    // =========================

    "Port",
    "Sea Port",
    "Fishing Port",
    "Container Port",
    "Dry Port",
    "Jetty",
    "Dock",
    "Dockyard",
    "Shipyard",

    // =========================
    // ENERGY
    // =========================

    "Power Plant",
    "Thermal Power Plant",
    "Hydro Power Plant",
    "Nuclear Power Plant",
    "Solar Farm",
    "Wind Farm",
    "Substation",
    "Oil Refinery",
    "Gas Terminal",

    // =========================
    // WATER
    // =========================

    "River",
    "Canal",
    "Lake",
    "Reservoir",
    "Dam",
    "Water Treatment Plant",

    // =========================
    // TELECOM
    // =========================

    "Mobile Tower",
    "Communication Tower",
    "Radio Station",
    "TV Tower",
    "Data Center",

    // =========================
    // INDUSTRY
    // =========================

    "Factory",
    "Industrial Area",
    "Warehouse",
    "Cold Storage",
    "Steel Plant",
    "Cement Plant",

    // =========================
    // GOVERNMENT
    // =========================

    "Police Station",
    "Fire Station",
    "Court",
    "Collector Office",
    "Municipal Office",

    // =========================
    // HEALTH
    // =========================

    "Hospital",
    "Clinic",
    "Medical College",
    "PHC",

    // =========================
    // EDUCATION
    // =========================

    "School",
    "College",
    "University",
    "Research Institute",

    // =========================
    // TOURISM
    // =========================

    "Temple",
    "Mosque",
    "Church",
    "Museum",
    "Fort",
    "Monument",
    "Park",
    "Zoo",

    // =========================
    // LAND
    // =========================

    "Forest",
    "Hill",
    "Mountain",
    "Village",
    "Town",
    "City"

];

document.addEventListener("DOMContentLoaded", function () {

    const select = document.getElementById("featureType");

    FEATURE_TYPES.forEach(function(type){

        const option = document.createElement("option");

        option.value = type;
        option.textContent = type;

        select.appendChild(option);

    });

});