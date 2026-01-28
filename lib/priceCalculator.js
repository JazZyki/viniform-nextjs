// lib/priceCalculator.js

export const PRICE_TABLE = [
    { min: 1, max: 1, horizontal: { 20: 688, 30: 743, 40: 803 }, vertical: { 20: 780, 30: 842, 40: 910 }, frame: { 20: 917, 30: 990, 40: 1069 } },
    { min: 2, max: 4, horizontal: { 20: 1238, 30: 1338, 40: 1445 }, vertical: { 20: 1402, 30: 1513, 40: 1634 }, frame: { 20: 1650, 30: 1782, 40: 1925 } },
    { min: 5, max: 8, horizontal: { 20: 1856, 30: 2005, 40: 2166 }, vertical: { 20: 2105, 30: 2273, 40: 2445 }, frame: { 20: 2476, 30: 2674, 40: 2887 } },
    { min: 9, max: 13, horizontal: { 20: 2729, 30: 2947, 40: 3184 }, vertical: { 20: 3092, 30: 3340, 40: 3607 }, frame: { 20: 3640, 30: 3931, 40: 3607 } }, // Pozor na 3607
    { min: 14, max: 19, horizontal: { 20: 3110, 30: 3359, 40: 3628 }, vertical: { 20: 3526, 30: 3808, 40: 4112 }, frame: { 20: 4148, 30: 4481, 40: 4840 } },
    { min: 20, max: 26, horizontal: { 20: 3515, 30: 3796, 40: 4099 }, vertical: { 20: 3984, 30: 4303, 40: 4648 }, frame: { 20: 4686, 30: 5060, 40: 5465 } },
    { min: 27, max: 34, horizontal: { 20: 4176, 30: 4510, 40: 4871 }, vertical: { 20: 4343, 30: 4691, 40: 5066 }, frame: { 20: 5568, 30: 6013, 40: 6494 } },
    { min: 35, max: 43, horizontal: { 20: 4679, 30: 5053, 40: 5458 }, vertical: { 20: 4734, 30: 5113, 40: 5522 }, frame: { 20: 6236, 30: 6736, 40: 7247 } },
    { min: 44, max: 53, horizontal: { 20: 5238, 30: 5445, 40: 6109 }, vertical: { 20: 5302, 30: 5725, 40: 6184 }, frame: { 20: 6985, 30: 7544, 40: 8148 } },
    { min: 54, max: 64, horizontal: { 20: 6287, 30: 6790, 40: 7333 }, vertical: { 20: 5939, 30: 6414, 40: 6928 }, frame: { 20: 8382, 30: 9053, 40: 9778 } },
    { min: 65, max: 80, horizontal: { 20: 7544, 30: 8148, 40: 8800 }, vertical: { 20: 7126, 30: 7372, 40: 8311 }, frame: { 20: 10058, 30: 10864, 40: 11732 } },
    { min: 81, max: 100, horizontal: { 20: 8798, 30: 9503, 40: 10264 }, vertical: { 20: 8551, 30: 9234, 40: 9973 }, frame: { 20: 11564, 30: 12490, 40: 13489 } },
    { min: 101, max: 120, horizontal: { 20: 9612, 30: 10381, 40: 11212 }, vertical: { 20: 9887, 30: 10678, 40: 11532 }, frame: { 20: 12690, 30: 13705, 40: 14802 } },
    { min: 121, max: 140, horizontal: { 20: 9988, 30: 10787, 40: 11650 }, vertical: { 20: 10829, 30: 11695, 40: 12631 }, frame: { 20: 13283, 30: 14346, 40: 15493 } },
    { min: 141, max: 160, horizontal: { 20: 11086, 30: 11972, 40: 12930 }, vertical: { 20: 12545, 30: 13548, 40: 14632 }, frame: { 20: 14743, 30: 15923, 40: 17197 } },
    { min: 161, max: 180, horizontal: { 20: 11480, 30: 12398, 40: 13391 }, vertical: { 20: 14148, 30: 15280, 40: 16502 }, frame: { 20: 15191, 30: 16406, 40: 17719 } },
    { min: 181, max: 200, horizontal: { 20: 12126, 30: 13096, 40: 14143 }, vertical: { 20: 15191, 30: 16406, 40: 17719 }, frame: { 20: 16087, 30: 17370, 40: 18832 } },
    { min: 221, max: 240, horizontal: { 20: 14566, 30: 15716, 40: 17171 }, vertical: { 20: 16981, 30: 18257, 40: 21151 }, frame: { 20: 19333, 30: 20858, 40: 22860 } },
    { min: 241, max: 260, horizontal: { 20: 15406, 30: 16619, 40: 18214 }, vertical: { 20: 17933, 30: 19279, 40: 22331 }, frame: { 20: 20450, 30: 22057, 40: 24246 } },
    { min: 261, max: 280, horizontal: { 20: 16062, 30: 17324, 40: 19027 }, vertical: { 20: 18676, 30: 20077, 40: 23254 }, frame: { 20: 21323, 30: 22996, 40: 25328 } },
    { min: 281, max: 300, horizontal: { 20: 16716, 30: 18028, 40: 19840 }, vertical: { 20: 19417, 30: 20874, 40: 24174 }, frame: { 20: 22193, 30: 23930, 40: 26410 } },
    { min: 301, max: 320, horizontal: { 20: 17140, 30: 18482, 40: 20365 }, vertical: { 20: 19898, 30: 21390, 40: 24770 }, frame: { 20: 22757, 30: 24536, 40: 27109 } },
    { min: 321, max: 340, horizontal: { 20: 17336, 30: 18694, 40: 20609 }, vertical: { 20: 20120, 30: 21629, 40: 25045 }, frame: { 20: 23017, 30: 24816, 40: 27432 } },
    { min: 341, max: 360, horizontal: { 20: 17909, 30: 19309, 40: 21320 }, vertical: { 20: 20770, 30: 22327, 40: 25852 }, frame: { 20: 23780, 30: 25636, 40: 28379 } },
    { min: 361, max: 380, horizontal: { 20: 18115, 30: 19530, 40: 21576 }, vertical: { 20: 21002, 30: 22577, 40: 26141 }, frame: { 20: 24054, 30: 25930, 40: 28718 } },
    { min: 381, max: 400, horizontal: { 20: 18452, 30: 19892, 40: 21994 }, vertical: { 20: 21384, 30: 22987, 40: 26615 }, frame: { 20: 24502, 30: 26412, 40: 29275 } },
];

export function calculatePartPrice(count, diameter, category, isAluminium, isPreLeveling) {
    if (count <= 0 || !diameter) return 0;

    // Najdeme řádek, kde počet důlků spadá do intervalu min-max
    const row = PRICE_TABLE.find(r => count >= r.min && count <= r.max);
    
    // Pokud je počet důlků vyšší než 400, vezmeme poslední známý řádek (nebo upravit dle zadání)
    const effectiveRow = row || PRICE_TABLE[PRICE_TABLE.length - 1];
    
    // Získání základní ceny z matice
    let price = effectiveRow[category][diameter] || 0;

    // Aplikace příplatků a slev
    if (isAluminium) price *= 1.20;    // +20%
    if (isPreLeveling) price *= 0.50;  // -50% (Sleva za předrovnání)

    return Math.round(price);
}