// Pomocná data pro GLOBAL ceník z obrázku
const GLOBAL_PRICE_ROWS = [
    { max: 20, price: 2500 },
    { max: 29, price: 2650 },
    { max: 39, price: 2900 },
    { max: 59, price: 3050 },
    { max: 79, price: 3300 },
    { max: 99, price: 3650 },
    { max: 129, price: 4250 },
    { max: 159, price: 4750 },
    { max: 189, price: 5200 },
    { max: 219, price: 5700 },
    { max: 249, price: 6250 },
    { max: 279, price: 6830 },
    { max: 309, price: 7410 },
    { max: 339, price: 7990 },
    { max: 369, price: 8570 },
    { max: 399, price: 9150 },
    { max: 429, price: 9730 },
    { max: 459, price: 10310 },
    { max: 519, price: 10890 },
    { max: 549, price: 11470 },
    { max: 579, price: 12050 },
    { max: 609, price: 12630 },
    { max: 639, price: 13210 },
    { max: 669, price: 13790 },
    { max: 699, price: 14370 },
    { max: Infinity, price: 14950 }, // 700 a více
];

const DENT_PRICELIST = {
    20: 2450,
    30: 2624,
    40: 2878,
    60: 3036,
    80: 3301,
    100: 3640,
    130: 4219,
    160: 4723,
    190: 5164,
    220: 5671,
    250: 6239,
    280: 6750,
    310: 7340,
    340: 7940,
    370: 8510,
    400: 9060,
    430: 9630,
    460: 10220,
    490: 10770,
    520: 11350,
    550: 11920,
    580: 12510,
    610: 13060,
    640: 13650,
    670: 14210,
    700: 14770,
};

// Pomocná funkce pro nalezení ceny v Global tabulce
const getGlobalBasePrice = (diameter) => {
    if (!diameter) return 0;
    const val = parseInt(diameter);
    // Najdeme první řádek, kde je vybraný průměr menší nebo roven maximu rozsahu
    const row = GLOBAL_PRICE_ROWS.find((r) => val <= r.max);
    return row ? row.price : 0;
};

export const calculateDentPrice = (
    count1,
    diameter1,
    count2,
    diameter2,
    isAlu,
    isPreLeveling,
    useGlobalPrices = false
) => {
    let price1, price2;

    if (useGlobalPrices) {
        price1 = getGlobalBasePrice(diameter1);
        price2 = getGlobalBasePrice(diameter2);
    } else {
        price1 = DENT_PRICELIST[diameter1] || 0;
        price2 = DENT_PRICELIST[diameter2] || 0;
    }

    const c1 = parseInt(count1) || 0;
    const c2 = parseInt(count2) || 0;

    if ((price1 === 0 || c1 === 0) && (price2 === 0 || c2 === 0)) return 0;

    let allDentsOnPart = [];
    for (let i = 0; i < c1; i++) allDentsOnPart.push(price1);
    for (let i = 0; i < c2; i++) allDentsOnPart.push(price2);

    allDentsOnPart.sort((a, b) => b - a);

    // Výpočet ceny JEDNOHO dílu (1. důlek 100%, ostatní 50%)
    let total = allDentsOnPart[0] || 0;
    for (let i = 1; i < allDentsOnPart.length; i++) {
        total += allDentsOnPart[i] * 0.5;
    }

    if (isAlu) total *= 1.2;
    if (isPreLeveling) total *= 0.5;

    return Math.round(total);
};

export const calculateGlobalPartCascade = (activeParts) => {
    return activeParts.map((part, index) => {
        let coefficient = 1;

        // Tato logika přesně kopíruje sloupce z tvého obrázku:
        // I. Poškození = 100%, II. = 50%, III. = 25%, IV. = 12.5%, V. = 6.25%
        if (index === 1) coefficient = 0.5; // II. poškození
        else if (index === 2) coefficient = 0.25; // III. poškození
        else if (index === 3) coefficient = 0.125; // IV. poškození
        else if (index >= 4) coefficient = 0.0625; // V. poškození (a další)

        return {
            id: part.id,
            finalPrice: Math.ceil(part.basePrice * coefficient),
        };
    });
};
