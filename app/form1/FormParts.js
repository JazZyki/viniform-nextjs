"use client";
import { calculatePartPrice } from "../../lib/priceCalculator";

export default function FormPart({ id, label, category, formData, onImageChange, onChange, onCheckboxChange }) {
    // Logika pro dynamické zobrazení fotek (Max 5)
    const images = formData[id] || [];
    const filledImagesCount = images.filter(img => img !== "").length;
    // Zobrazíme tolik polí, kolik je vyplněných + 1 prázdné (pokud jsme pod limitem 5)
    const visibleInputsCount = Math.min(filledImagesCount + 1, 5);

    // Opravená funkce pro výpočet ceny
    const count = parseInt(formData[`${id}Count`]) || 0;
    const diameter = formData[`${id}Diameter`];

    // Zde počítáme cenu za konkrétní díl
    // Přidal jsem kontrolu "isAluminium" a "isPreLeveling"
    const currentPrice = calculatePartPrice(
        count,
        diameter,
        category,
        formData[`${id}Alu`], // Budeme potřebovat nový checkbox pro hliník
        formData[`${id}Lak`]  // Předpokládám, že Lak = Předrovnání (-50%)? Upravte dle potřeby.
    );

    return (
        <div className="form-field border-b pb-6 mb-6 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
                <p className="font-bold text-lg text-maingreen">{label}</p>
                {currentPrice > 0 && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                        Odhad: {currentPrice.toLocaleString()} Kč
                    </span>
                )}
            </div>

            {/* Nahrávání fotek - generuje se 10 vstupů pro každý díl */}
            <div className="grid grid-cols-1 gap-2 mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase">Fotodokumentace poškození (max. 5 fotek):</p>
                {[...Array(visibleInputsCount)].map((_, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className={`flex-1 border-2 border-dashed rounded-lg p-2 transition-colors ${images[index] ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                            <input
                                type="file"
                                accept="image/*"
                                capture="camera"
                                className="text-sm w-full cursor-pointer"
                                onChange={(e) => onImageChange(id, index, e.target.files[0])}
                            />
                        </div>
                        {images[index] && <span className="text-green-600 text-xl">✓</span>}
                    </div>
                ))}
            </div>

            <div className="flex flex-row gap-4">
                <label className="w-1/2">
                    <span className="block text-sm">Počet důlků</span>
                    <input
                        type="number"
                        name={`${id}Count`}
                        value={formData[`${id}Count`] || 0}
                        onChange={onChange}
                        className="w-full p-2 border rounded"
                        min="0"
                    />
                </label>
                <label className="w-1/2">
                    <span className="block text-sm">Průměr</span>
                    <select
                        name={`${id}Diameter`}
                        value={formData[`${id}Diameter`] || ""}
                        onChange={onChange}
                        className="w-full p-2 border rounded"
                    >
                        <option value="" disabled>
                            Vyberte průměr
                        </option>
                        <option value="20">20 mm</option>
                        <option value="30">30 mm</option>
                        <option value="40">40 mm</option>
                        {/*<option value="50">50 mm</option>
                        <option value="60">60 mm</option>
                        <option value="70">70 mm</option>
                        <option value="80">80 mm</option>
                        <option value="90">90 mm</option>
                        <option value="100">100 mm</option>*/}
                    </select>
                </label>
            </div>

            <div className="flex items-start gap-8 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        name={`${id}Lak`}
                        checked={formData[`${id}Lak`] || false}
                        onChange={onCheckboxChange}
                        className="w-5 h-5"
                    />
                    <span className="text-sm font-semibold">Lakování</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        name={`${id}Vymena`}
                        checked={formData[`${id}Vymena`] || false}
                        onChange={onCheckboxChange}
                        className="w-5 h-5"
                    />
                    <span className="text-sm font-semibold">Výměna</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        name={`${id}Alu`}
                        checked={formData[`${id}Alu`] || false}
                        onChange={onCheckboxChange}
                        className="w-5 h-5 text-orange-500"
                    />
                    <span className="text-sm font-semibold">Hliník (+20%)</span>
                </label>
            </div>
        </div>
    );
}