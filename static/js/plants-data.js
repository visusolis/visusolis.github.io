// Plantdle - Plant Database
// 20 common plants with Wikipedia image URLs

const plants = [
    {
        "id": 1,
        "scientificName": "Rosa damascena",
        "commonNames": ["Rose", "Damask Rose", "Garden Rose"],
        "region": "Middle East, Europe",
        "wikipediaImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Damask_rose_pink.jpg/512px-Damask_rose_pink.jpg",
        "alternativeName": "Turkish Rose",
        "wikipediaPage": "https://en.wikipedia.org/wiki/Rosa_damascena"
    },
    {
        "id": 2,
        "scientificName": "Helianthus annuus",
        "commonNames": ["Sunflower", "Common Sunflower"],
        "region": "North America",
        "wikipediaImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Sunflower_sky_backdrop.jpg/512px-Sunflower_sky_backdrop.jpg",
        "alternativeName": "Kansas Sunflower",
        "wikipediaPage": "https://en.wikipedia.org/wiki/Helianthus_annuus"
    },
    {
        "id": 3,
        "scientificName": "Tulipa",
        "commonNames": ["Tulip", "Garden Tulip", "Turkish Tulip"],
        "region": "Central Asia, Turkey",
        "wikipediaImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/צבעונים.JPG/512px-צבעונים.JPG",
        "alternativeName": "Dutch Tulip",
        "wikipediaPage": "https://en.wikipedia.org/wiki/Tulip"
    },
    {
        "id": 4,
        "scientificName": "Bellis perennis",
        "commonNames": ["Daisy", "Common Daisy", "English Daisy"],
        "region": "Europe",
        "wikipediaImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Bellis_perennis_white_%28aka%29.jpg/512px-Bellis_perennis_white_%28aka%29.jpg",
        "alternativeName": "Lawn Daisy",
        "wikipediaPage": "https://en.wikipedia.org/wiki/Bellis_perennis"
    },
    {
        "id": 5,
        "scientificName": "Monstera deliciosa",
        "commonNames": ["Monstera", "Swiss Cheese Plant"],
        "region": "Central America",
        "wikipediaImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Monstera_deliciosa3.jpg/512px-Monstera_deliciosa3.jpg",
        "alternativeName": "Split-leaf Philodendron",
        "wikipediaPage": "https://en.wikipedia.org/wiki/Monstera_deliciosa"
    },
    {
        "id": 6,
        "scientificName": "Epipremnum aureum",
        "commonNames": ["Pothos", "Golden Pothos", "Devil's Ivy"],
        "region": "Southeast Asia",
        "wikipediaImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Epipremnum_aureum_31082013.jpg/512px-Epipremnum_aureum_31082013.jpg",
        "alternativeName": "Money Plant",
        "wikipediaPage": "https://en.wikipedia.org/wiki/Epipremnum_aureum"
    },
    {
        "id": 7,
        "scientificName": "Quercus",
        "commonNames": ["Oak", "Oak Tree"],
        "region": "Northern Hemisphere",
        "wikipediaImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Quercus_robur.jpg/512px-Quercus_robur.jpg",
        "alternativeName": "English Oak",
        "wikipediaPage": "https://en.wikipedia.org/wiki/Oak"
    },
    {
        "id": 8,
        "scientificName": "Acer",
        "commonNames": ["Maple", "Maple Tree"],
        "region": "Northern Hemisphere",
        "wikipediaImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Acer_saccharum_3-eheep_%284%29.JPG/512px-Acer_saccharum_3-eheep_%284%29.JPG",
        "alternativeName": "Sugar Maple",
        "wikipediaPage": "https://en.wikipedia.org/wiki/Maple"
    },
    {
        "id": 9,
        "scientificName": "Ocimum basilicum",
        "commonNames": ["Basil", "Sweet Basil", "Thai Basil"],
        "region": "India, Southeast Asia",
        "wikipediaImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Basil-Basilico-Ocimum_basilicum-albahaca.jpg/512px-Basil-Basilico-Ocimum_basilicum-albahaca.jpg",
        "alternativeName": "King of Herbs",
        "wikipediaPage": "https://en.wikipedia.org/wiki/Basil"
    },
    {
        "id": 10,
        "scientificName": "Lavandula",
        "commonNames": ["Lavender", "English Lavender", "French Lavender"],
        "region": "Mediterranean",
        "wikipediaImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Single_lavendar_flower02.jpg/512px-Single_lavendar_flower02.jpg",
        "alternativeName": "True Lavender",
        "wikipediaPage": "https://en.wikipedia.org/wiki/Lavandula"
    },
    {
        "id": 11,
        "scientificName": "Taraxacum officinale",
        "commonNames": ["Dandelion", "Common Dandelion"],
        "region": "Europe, Asia, North America",
        "wikipediaImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Taraxacum_officinale_%28Flower%29.jpg/512px-Taraxacum_officinale_%28Flower%29.jpg",
        "alternativeName": "Lion's Tooth",
        "wikipediaPage": "https://en.wikipedia.org/wiki/Taraxacum_officinale"
    },
    {
        "id": 12,
        "scientificName": "Spathiphyllum",
        "commonNames": ["Peace Lily", "White Sails"],
        "region": "Central America, Southeast Asia",
        "wikipediaImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Spathiphyllum_cochlearispathum_RTBG.jpg/512px-Spathiphyllum_cochlearispathum_RTBG.jpg",
        "alternativeName": "Closet Plant",
        "wikipediaPage": "https://en.wikipedia.org/wiki/Spathiphyllum"
    },
    {
        "id": 13,
        "scientificName": "Sansevieria trifasciata",
        "commonNames": ["Snake Plant", "Mother-in-Law's Tongue"],
        "region": "West Africa",
        "wikipediaImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Snake_Plant_%28Sansevieria_trifasciata%29.jpg/512px-Snake_Plant_%28Sansevieria_trifasciata%29.jpg",
        "alternativeName": "Viper's Bowstring Hemp",
        "wikipediaPage": "https://en.wikipedia.org/wiki/Sansevieria_trifasciata"
    },
    {
        "id": 14,
        "scientificName": "Solanum lycopersicum",
        "commonNames": ["Tomato", "Tomato Plant"],
        "region": "South America",
        "wikipediaImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Tomato-plant.jpg/512px-Tomato-plant.jpg",
        "alternativeName": "Love Apple",
        "wikipediaPage": "https://en.wikipedia.org/wiki/Tomato"
    },
    {
        "id": 15,
        "scientificName": "Trifolium",
        "commonNames": ["Clover", "White Clover"],
        "region": "Europe, Asia",
        "wikipediaImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Trifolium_repens_flowers.jpg/512px-Trifolium_repens_flowers.jpg",
        "alternativeName": "Shamrock",
        "wikipediaPage": "https://en.wikipedia.org/wiki/Clover"
    },
    {
        "id": 16,
        "scientificName": "Pinus",
        "commonNames": ["Pine", "Pine Tree"],
        "region": "Northern Hemisphere",
        "wikipediaImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Pinus_sylvestris_cones.jpg/512px-Pinus_sylvestris_cones.jpg",
        "alternativeName": "Scots Pine",
        "wikipediaPage": "https://en.wikipedia.org/wiki/Pine"
    },
    {
        "id": 17,
        "scientificName": "Tagetes",
        "commonNames": ["Marigold", "French Marigold", "Mexican Marigold"],
        "region": "Mexico, Central America",
        "wikipediaImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Tagetes_patula-ctj.jpg/512px-Tagetes_patula-ctj.jpg",
        "alternativeName": "Aztec Marigold",
        "wikipediaPage": "https://en.wikipedia.org/wiki/Tagetes"
    },
    {
        "id": 18,
        "scientificName": "Rosmarinus officinalis",
        "commonNames": ["Rosemary", "Garden Rosemary"],
        "region": "Mediterranean",
        "wikipediaImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Rosmarinus_officinalis349.jpg/512px-Rosmarinus_officinalis349.jpg",
        "alternativeName": "Dew of the Sea",
        "wikipediaPage": "https://en.wikipedia.org/wiki/Rosemary"
    },
    {
        "id": 19,
        "scientificName": "Hibiscus",
        "commonNames": ["Hibiscus", "Rose Mallow"],
        "region": "Tropical and Subtropical Regions",
        "wikipediaImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Hibiscus_flower_TZ.jpg/512px-Hibiscus_flower_TZ.jpg",
        "alternativeName": "Shoe Flower",
        "wikipediaPage": "https://en.wikipedia.org/wiki/Hibiscus"
    },
    {
        "id": 20,
        "scientificName": "Ficus lyrata",
        "commonNames": ["Fiddle Leaf Fig", "Fiddle-leaf Fig Tree"],
        "region": "West Africa",
        "wikipediaImageUrl": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Ficus_lyrata2.jpg/512px-Ficus_lyrata2.jpg",
        "alternativeName": "Banjo Fig",
        "wikipediaPage": "https://en.wikipedia.org/wiki/Ficus_lyrata"
    }
];

// Export for use in game logic
window.plantsDatabase = plants;