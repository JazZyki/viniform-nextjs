'use client';
import { useState } from 'react';
import { calculateDentPrice } from '../../lib/priceCalculatorParking';
import { ImagePreview } from './ImagePreview';
import { DENT_DIAMETERS } from './config';

export default function FormPart({
    id,
    label,
    formData,
    onImageChange,
    onRemoveImage,
    onChange,
    onCheckboxChange,
    realPrice,
    hidePhotos = false,
    damageOrder, // Přidáno: index v seřazeném poli (0, 1, 2...)
    isGlobalMode, // Přidáno: boolean, zda jedeme v Global režimu
}) {
    const hasAnyDamage = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].some(
        (num) => (parseInt(formData[num === 1 ? `${id}Count` : `${id}Count${num}`]) || 0) > 0
    );
    const [isOpen, setIsOpen] = useState(hasAnyDamage);
    const images = formData[id] || [];
    const filledImages = images.filter((img) => img instanceof File);

    const canAddMore = filledImages.length < 5;

    const totalCount = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].reduce(
        (sum, num) => sum + (parseInt(formData[num === 1 ? `${id}Count` : `${id}Count${num}`]) || 0),
        0
    );

    const damages = [];
    for (let num = 1; num <= 10; num++) {
        const cKey = num === 1 ? `${id}Count` : `${id}Count${num}`;
        const dKey = num === 1 ? `${id}Diameter` : `${id}Diameter${num}`;
        damages.push({ count: formData[cKey], diameter: formData[dKey] });
    }

    const currentPrice = calculateDentPrice(
        damages,
        formData[`${id}Alu`],
        formData[`${id}Lak`],
        isGlobalMode // Předáme informaci o ceníku do kalkulátoru
    );

    const hasNoImage = filledImages.length === 0;

    // Funkce pro generování textu a barvy Badge
    const renderOrderBadge = () => {
        // Pokud díl nemá žádnou cenu nebo nebyl nalezen v pořadí, nic nezobrazíme
        if (damageOrder === undefined || damageOrder === -1 || realPrice === 0)
            return null;

        const romanNumerals = ['I.', 'II.', 'III.', 'IV.', 'V.'];
        let badgeText = '';

        if (isGlobalMode) {
            // Logika pro GLOBAL: I. až V., pak už zůstává V.
            badgeText = damageOrder < 5 ? romanNumerals[damageOrder] : 'V.+';
        } else {
            // Logika pro BASIC: 100% (I.), pak všechno 50% (II.+)
            badgeText = damageOrder === 0 ? 'I.' : 'II.+';
        }

        return (
            <span
                className={`absolute -bottom-1 text-[10px] font-black uppercase mt-1 px-2 py-0.5 rounded shadow-sm ${
                    damageOrder === 0
                        ? 'bg-maingreen text-white' // První nejdražší je zelený
                        : 'bg-orange-100 text-orange-700 border border-orange-200' // Ostatní jsou oranžoví
                }`}
            >
                {badgeText} POŠKOZENÍ
            </span>
        );
    };

    return (
        <div className="form-field border-b mb-10 bg-gray-50 p-4 rounded-xl shadow-sm transition-all duration-300">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex justify-between items-center cursor-pointer"
            >
                <div className="flex items-center gap-1">
                    <span
                        className={`text-maingreen transition-transform duration-300 ${
                            isOpen ? 'rotate-0' : '-rotate-90'
                        }`}
                    >
                        ▼
                    </span>
                    <div className="flex flex-col gap-0.5">
                        <p
                            className={`font-bold uppercase tracking-tighter ${
                                totalCount > 0 ? 'text-maingreen' : 'text-gray-600'
                            }`}
                        >
                            {label}
                        </p>
                    </div>
                </div>
                {realPrice > 0 && (
                    <div className="flex flex-col items-end min-w-[170px] relative">
                        <span className="absolute bottom-4 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold border border-green-200">
                            Cena: {realPrice.toLocaleString()} Kč
                        </span>

                        {/* Zde vykreslíme náš nový štítek I., II., III... */}
                        {renderOrderBadge()}
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="mt-4 animate-in fade-in duration-300">
                    {!hidePhotos && (
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    Fotodokumentace (max 5):
                                </p>
                                {hasNoImage && totalCount > 0 && (
                                    <span className="text-[#8f2215] text-[9px] font-black uppercase tracking-tighter animate-pulse">
                                        ⚠ Chybí foto
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-2 items-center">
                                {images.map(
                                    (file, index) =>
                                        file instanceof File && (
                                             <ImagePreview
                                                key={`${id}-img-${index}`}
                                                file={file}
                                                onRemove={() =>
                                                    onRemoveImage(id, index)
                                                }
                                            />
                                        )
                                )}
                                {canAddMore && (
                                    <label className="h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-white hover:border-maingreen cursor-pointer transition-colors">
                                        <span className="text-2xl text-gray-400">
                                            +
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold">
                                            FOTO
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*; capture=camera"
                                            className="hidden"
                                            onChange={(e) =>
                                                onImageChange(
                                                    id,
                                                    images.findIndex(
                                                        (img) => img === ''
                                                    ),
                                                    e.target.files[0]
                                                )
                                            }
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
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
                                        <span className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                            Počet ({num})
                                        </span>
                                        <input
                                            type="number"
                                            name={countKey}
                                            value={formData[countKey] !== undefined ? formData[countKey] : 0}
                                            onChange={onChange}
                                            className="w-full p-2 border rounded-lg bg-white h-[40px]"
                                            min="0"
                                            onFocus={(e) =>
                                                e.target.value === '0' &&
                                                (e.target.value = '')
                                            }
                                        />
                                    </label>
                                    <label>
                                        <span className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                                            Průměr ({num})
                                        </span>
                                        <select
                                            name={diamKey}
                                            value={formData[diamKey] || ''}
                                            onChange={onChange}
                                            className="w-full p-2 border rounded-lg bg-white h-[40px]"
                                        >
                                            <option value="">-</option>
                                            {DENT_DIAMETERS.map((d) => (
                                                <option key={d} value={d}>
                                                    {d} mm
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex flex-wrap justify-between gap-4 mt-4 bg-white p-3 rounded-lg border border-gray-100">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name={`${id}Lak`}
                                checked={formData[`${id}Lak`] || false}
                                onChange={onCheckboxChange}
                                className="w-5 h-5 rounded border-gray-300 text-maingreen focus:ring-maingreen"
                            />
                            <span className="text-sm">Lakování</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name={`${id}Vymena`}
                                checked={formData[`${id}Vymena`] || false}
                                onChange={onCheckboxChange}
                                className="w-5 h-5 rounded border-gray-300 text-maingreen focus:ring-maingreen"
                            />
                            <span className="text-sm">Výměna</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                name={`${id}Alu`}
                                checked={formData[`${id}Alu`] || false}
                                onChange={onCheckboxChange}
                                className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            />
                            <span className="text-sm text-orange-700 font-medium">
                                Hliník (+20%)
                            </span>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}
