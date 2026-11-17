# Dokumentace provedených úprav (10 poškození na díl + kontrola roku výroby)

Tento dokument slouží jako detailní přehled a návod pro přenesení identických úprav do druhého projektu (např. verze s fotografiemi).

---

## Přehled dotčených souborů
1. `lib/priceCalculator.js`
2. `lib/priceCalculatorParking.js`
3. `lib/pdfGenerator.js`
4. `app/kroupy/FormParts.js`
5. `app/kroupy/FormClient.js`
6. `app/kroupy/FormInput.js`
7. `app/parking/FormParts.js`
8. `app/parking/FormClient.js`
9. `app/parking/FormInput.js`
10. `app/edit-hail/page.js`
11. `app/edit-parking/page.js`

---

## 1. Výpočetní logika (`lib/`)

### A. `lib/priceCalculator.js` (Kroupy)
Přidána pomocná funkce `calculateTotalPartPrice` pro sečtení ceny všech zadaných poškození na dílu. Původní `calculatePartPrice` zůstala beze změny (pouze bezpečný přístup `effectiveRow[category]?.[diameter]`).

```javascript
export function calculateTotalPartPrice(damages, category, isAluminium, isPreLeveling) {
    if (!Array.isArray(damages) || damages.length === 0) return 0;
    let total = 0;
    for (const d of damages) {
        const count = parseInt(d.count) || 0;
        const diam = d.diameter;
        if (count > 0 && diam) {
            total += calculatePartPrice(count, diam, category, isAluminium, isPreLeveling);
        }
    }
    return Math.round(total);
}
```

### B. `lib/priceCalculatorParking.js` (Parking)
Funkce `calculateDentPrice` byla upravena tak, aby přijímala buď pole poškození `damages` (až 10 položek), nebo fungovala i se starou signaturou:

```javascript
export const calculateDentPrice = (
    damagesOrCount1,
    diameter1OrIsAlu,
    count2OrIsPreLeveling,
    diameter2OrUseGlobalPrices,
    isAlu,
    isPreLeveling,
    useGlobalPrices = false
) => {
    let damages = [];
    let alu = false;
    let preLeveling = false;
    let globalPrices = false;

    if (Array.isArray(damagesOrCount1)) {
        damages = damagesOrCount1;
        alu = Boolean(diameter1OrIsAlu);
        preLeveling = Boolean(count2OrIsPreLeveling);
        globalPrices = Boolean(diameter2OrUseGlobalPrices);
    } else {
        damages = [
            { count: damagesOrCount1, diameter: diameter1OrIsAlu },
            { count: count2OrIsPreLeveling, diameter: diameter2OrUseGlobalPrices },
        ];
        alu = Boolean(isAlu);
        preLeveling = Boolean(isPreLeveling);
        globalPrices = Boolean(useGlobalPrices);
    }

    let allDentsOnPart = [];
    for (const d of damages) {
        const c = parseInt(d.count) || 0;
        if (c <= 0 || !d.diameter) continue;
        const price = globalPrices
            ? getGlobalBasePrice(d.diameter)
            : (DENT_PRICELIST[d.diameter] || 0);
        if (price > 0) {
            for (let i = 0; i < c; i++) {
                allDentsOnPart.push(price);
            }
        }
    }

    if (allDentsOnPart.length === 0) return 0;

    allDentsOnPart.sort((a, b) => b - a);

    // Výpočet ceny JEDNOHO dílu (1. důlek 100%, ostatní 50%)
    let total = allDentsOnPart[0] || 0;
    for (let i = 1; i < allDentsOnPart.length; i++) {
        total += allDentsOnPart[i] * 0.5;
    }

    if (alu) total *= 1.2;
    if (preLeveling) total *= 0.5;

    return Math.round(total);
};
```

---

## 2. Zobrazení až 10 poškození u dílů

Pojmenování klíčů ve formuláři zachovává 100% zpětnou kompatibilitu:
* 1. poškození: `${id}Count`, `${id}Diameter`
* 2. až 10. poškození: `${id}Count2` .. `${id}Count10`, `${id}Diameter2` .. `${id}Diameter10`

### A. `app/kroupy/FormParts.js`
* Vykresluje pole pro poškození 1 až 10.
* Další řádek se zobrazí, pokud je předchozí vyplněn (`prevCount > 0 && prevDiam !== ''`), případně pokud už daný řádek má data.
* Cena dílu sčítá všechna zadaná poškození (1 až 10).

```jsx
{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
    const countKey = num === 1 ? `${id}Count` : `${id}Count${num}`;
    const diamKey = num === 1 ? `${id}Diameter` : `${id}Diameter${num}`;
    const prevCountKey = num === 2 ? `${id}Count` : `${id}Count${num - 1}`;
    const prevDiamKey = num === 2 ? `${id}Diameter` : `${id}Diameter${num - 1}`;

    const prevCount = parseInt(formData[prevCountKey]) || 0;
    const prevDiam = formData[prevDiamKey];
    const currentCount = parseInt(formData[countKey]) || 0;
    const currentDiam = formData[diamKey];

    const isVisible =
        num === 1 ||
        (prevCount > 0 && prevDiam !== '') ||
        currentCount > 0 ||
        Boolean(currentDiam);

    if (!isVisible) return null;

    return (
        <div key={num} className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-1 duration-300">
            <label>
                <span className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Počet důlků ({num})
                </span>
                <input
                    type="number"
                    name={countKey}
                    value={formData[countKey] !== undefined ? formData[countKey] : 0}
                    onChange={onChange}
                    className="w-full p-2 border rounded-lg bg-white h-[42px]"
                    min="0"
                    onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                />
            </label>
            <label>
                <span className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Průměr ({num})
                </span>
                <select
                    name={diamKey}
                    value={formData[diamKey] || ''}
                    onChange={onChange}
                    className="w-full p-2 border rounded-lg bg-white h-[42px]"
                >
                    <option value="">Vyberte...</option>
                    <option value="20">20 mm</option>
                    <option value="30">30 mm</option>
                    <option value="40">40 mm</option>
                </select>
            </label>
        </div>
    );
})}
```

### B. `app/parking/FormParts.js`
* Stejný mapovací cyklus `[1..10]` nahradil původní pevné bloky pro (1) a (2).
* `isOpen` a `totalCount` testují, zda má díl alespoň jedno z 10 poškození větší než 0.
* Volby průměrů využívají `DENT_DIAMETERS`.

---

## 3. Aktualizace stavu formulářů a kalkulace

### A. Inicializace stavu (`createInitialState`)
Ve všech souborech (`app/kroupy/FormClient.js`, `app/parking/FormClient.js`, `app/edit-hail/page.js`, `app/edit-parking/page.js`):
```javascript
// Pro každý díl inicializovat indexy 1 až 10:
for (let i = 1; i <= 10; i++) {
    const countKey = i === 1 ? `${part.id}Count` : `${part.id}Count${i}`;
    const diamKey = i === 1 ? `${part.id}Diameter` : `${part.id}Diameter${i}`;
    state[countKey] = 0;
    state[diamKey] = '';
}
```

### B. Celkový součet ceny
* **V Kroupách (`FormClient.js`, `edit-hail/page.js`):**
  V `getGrandTotal` se pro každý díl prochází cyklus `1..10` a sčítá se `calculatePartPrice`.
* **V Parkingu (`FormClient.js`, `edit-parking/page.js`):**
  V `getRealPartPrices` se do `calculateDentPrice` předává pole 10 poškození:
  ```javascript
  const damages = [];
  for (let i = 1; i <= 10; i++) {
      const countKey = i === 1 ? `${part.id}Count` : `${part.id}Count${i}`;
      const diamKey = i === 1 ? `${part.id}Diameter` : `${part.id}Diameter${i}`;
      damages.push({ count: formData[countKey], diameter: formData[diamKey] });
  }
  const basePrice = calculateDentPrice(damages, formData[`${part.id}Alu`], formData[`${part.id}Lak`], isGlobalMode);
  ```

---

## 4. Generování PDF

### A. Kroupy (`app/kroupy/FormClient.js` a `lib/pdfGenerator.js`)
Pro každý díl se shromáždí všechna zadaná poškození (`activeDents`). Pokud je jich více, spojí se čárkou (např. `5, 2` a `20, 30`) a písmo se mírně přizpůsobí, aby se vešlo do kolonek předtištěného formuláře:
```javascript
const activeDents = [];
for (let i = 1; i <= 10; i++) {
    const countKey = i === 1 ? `${part.id}Count` : `${part.id}Count${i}`;
    const diamKey = i === 1 ? `${part.id}Diameter` : `${part.id}Diameter${i}`;
    const c = parseInt(formData[countKey]) || 0;
    const d = formData[diamKey];
    if (c > 0 && d) {
        activeDents.push({ count: c, diam: d });
    }
}
if (activeDents.length > 0) {
    const countsStr = activeDents.map((d) => d.count).join(', ');
    const diamsStr = activeDents.map((d) => d.diam).join(', ');
    if (activeDents.length > 1) {
        doc.setFontSize(countsStr.length > 6 || diamsStr.length > 6 ? 9 : 11);
    } else {
        doc.setFontSize(13);
    }
    doc.text(countsStr, part.x, part.y);
    doc.text(diamsStr, part.x + 25, part.y);
    doc.setFontSize(13);
}
```

### B. Parking (`app/parking/FormClient.js` a `app/edit-parking/page.js`)
V tabulce PDF se pro díl vypíše 1. řádek poškození a pro každé další vyplněné poškození (2 až 10) se posune `currentY += 4.5` a dopíše se počet a průměr pod předchozí.

---

## 5. Kontrola roku výroby (červená ikona Warning)

Pokud je rok výroby menší než **2020** (rok 2019 a starší), zobrazí se vedle popisku pole červená ikona vykřičníku.

### A. `app/kroupy/FormInput.js` a `app/parking/FormInput.js`
Přidán volitelný prop `warning`:
```jsx
export const FormInput = ({
    label,
    name,
    type = 'text',
    value,
    onChange,
    required,
    disabled,
    placeholder,
    options,
    fullWidth = false,
    className = '',
    warning = null,
}) => {
    // ...
    return (
        <label className={`flex flex-col text-sm font-semibold ${fieldClass} ${widthClass}`}>
            <div className="flex items-center gap-1.5 mb-1">
                <span>
                    {label} {required && <span className="text-red-600">*</span>}
                </span>
                {warning && (
                    <span title={typeof warning === 'string' ? warning : 'Upozornění: Rok výroby < 2020'}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4 text-red-600 flex-shrink-0 animate-in fade-in duration-200"
                        >
                            <path
                                fillRule="evenodd"
                                d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </span>
                )}
            </div>
            {/* Input / Select zůstává v původním standardním stylu */}
            ...
        </label>
    );
};
```

### B. Použití ve formulářích
Ve formulářích (`app/kroupy/FormClient.js`, `app/parking/FormClient.js`, `app/edit-hail/page.js`, `app/edit-parking/page.js`):
```javascript
const parsedYear = parseInt(formData.vehicleYear?.toString().trim(), 10);
const isYearWarning =
    !isNaN(parsedYear) &&
    ((formData.vehicleYear?.toString().trim().length >= 4 && parsedYear < 2020) ||
        (parsedYear > 1900 && parsedYear < 2020));
```
A předání do komponenty:
```jsx
<FormInput
    label="Rok výroby"
    name="vehicleYear"
    value={formData.vehicleYear}
    onChange={handleChange}
    disabled={!isSpzReady}
    warning={isYearWarning ? 'Vozidlo starší roku 2020' : null}
/>
```

---

## 6. Na co dát pozor u projektu s fotografiemi
* **Zachování stavu fotografií:** V `createInitialState` i při ukládání zachovejte pole pro fotografie (`photos`, `photoFiles` apod.). Úpravy dílů a roku výroby se polí pro fotografie nijak nedotýkají.
* **Export do JSON a IndexedDB:** Tyto mechanismy ukládají kompletní objekt `formData`, takže nová pole `${id}Count3` až `${id}Count10` a `${id}Diameter3` až `${id}Diameter10` se automaticky přenášejí do archivu i záloh bez nutnosti měnit `storage.js`.
