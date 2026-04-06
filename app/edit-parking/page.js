'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import { FormInput } from '../parking/FormInput';
import {
    CAR_PARTS,
    VEHICLE_BRANDS,
    ADDITIONAL_DAMAGES,
    getConfigForUser,
} from '../parking/config';
import {
    calculateDentPrice,
    calculateGlobalPartCascade,
} from '../../lib/priceCalculatorParking';
import { robotoBase64 } from '../../lib/fonts/Roboto-Condensed-normal';
import FormPart from '../parking/FormParts';

export default function CalculatorPage() {
    const [formKey, setFormKey] = useState(Date.now());
    const router = useRouter();
    const createInitialState = () => {
        const state = {
            vehicleSPZ: '',
            vehicleBrand: '',
            vehicleType: '',
            vehicleVIN: '',
            vehicleColor: '',
            vehicleYear: '',
            vehicleDistance: '',
            customerName: '',
            customerPhone: '',
            customerAddress: '',
            insuranceCompany: '',
            insuranceNumber: '',
            serviceDate: '',
            detailNotes: '',
            // Přidáme submissionMethod, aby FormPart věděl, co se děje (i když tady jen generujeme PDF)
            submissionMethod: 'download',
        };
        // Inicializace pro všechny díly (včetně extra)
        [...CAR_PARTS, ...ADDITIONAL_DAMAGES].forEach((part) => {
            state[`${part.id}Count`] = 0;
            state[`${part.id}Diameter`] = '';
            state[`${part.id}Count2`] = 0;
            state[`${part.id}Diameter2`] = '';
            state[`${part.id}Alu`] = false;
            state[`${part.id}Lak`] = false;
            state[`${part.id}Vymena`] = false;
            state[part.id] = []; // Pole pro fotky (i když v editoru jsou skryté)
        });
        return state;
    };

    const [formData, setFormData] = useState(createInitialState());

    const formatCzechDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('cs-CZ', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                const cleanedData = {};
                Object.keys(importedData).forEach((key) => {
                    if (!Array.isArray(importedData[key])) {
                        cleanedData[key] = importedData[key];
                    }
                });
                setFormData({ ...createInitialState(), ...cleanedData });
                setFormKey(Date.now());
                alert('Data byla úspěšně načtena.');
            } catch (err) {
                alert('Chyba při parsování JSON.');
            }
        };
        reader.readAsText(file);
    };

    const handleFieldChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };
    const userConfig = getConfigForUser(formData.technician);
    const isGlobalMode =
        userConfig.isGlobal === true ||
        ['Kooperativa', 'ČPP'].includes(formData.insuranceCompany);

    // --- NOVÁ LOGIKA VÝPOČTU CEN (shodná s FormClient) ---
    const getRealPartPrices = () => {
        const allPossibleParts = [...CAR_PARTS, ...ADDITIONAL_DAMAGES];
        const calculatedParts = allPossibleParts.map((part) => {
            const basePrice = calculateDentPrice(
                formData[`${part.id}Count`],
                formData[`${part.id}Diameter`],
                formData[`${part.id}Count2`],
                formData[`${part.id}Diameter2`],
                formData[`${part.id}Alu`],
                formData[`${part.id}Lak`],
                isGlobalMode,
            );
            return { id: part.id, basePrice };
        });
        const activeParts = calculatedParts
            .filter((p) => p.basePrice > 0)
            .sort((a, b) => b.basePrice - a.basePrice);
        const realPricesMap = {};
        allPossibleParts.forEach((p) => (realPricesMap[p.id] = 0));

        if (!isGlobalMode) {
            activeParts.forEach((part, index) => {
                realPricesMap[part.id] =
                    index === 0
                        ? part.basePrice
                        : Math.round(part.basePrice * 0.5);
            });
        } else {
            const results = calculateGlobalPartCascade(activeParts);
            results.forEach((res) => {
                realPricesMap[res.id] = res.finalPrice;
            });
        }
        return realPricesMap;
    };

    const realPartPrices = getRealPartPrices();

    const getGrandTotal = () => {
        const baseSum = Object.values(realPartPrices).reduce(
            (sum, price) => sum + price,
            0,
        );
        if (baseSum === 0) return { total: 0 };
        const fee = baseSum * 0.02;
        return { total: Math.round(baseSum + fee) };
    };

    const pricing = getGrandTotal();

    // Seřazené pole pro určení orderIndex (kvůli badgům)
    const activePartsSorted = [...CAR_PARTS, ...ADDITIONAL_DAMAGES]
        .map((p) => ({ id: p.id, price: realPartPrices[p.id] || 0 }))
        .filter((p) => p.price > 0)
        .sort((a, b) => b.price - a.price);

    const handleGeneratePDF = () => {
        const doc = new jsPDF();
        doc.addFileToVFS('Roboto-Condensed.ttf', robotoBase64);
        doc.addFont('Roboto-Condensed.ttf', 'RobotoCustom', 'normal');

        const backgroundImage = new window.Image();
        backgroundImage.src = userConfig.pdfBackground;

        backgroundImage.onload = () => {
            doc.addImage(backgroundImage, 'PNG', 0, 0, 210, 297);
            doc.setFont('RobotoCustom');
            doc.setFontSize(11);

            // 1. KONEČNÁ CENA (použijeme už vypočítaný pricing ze stavu)
            const [tpX, tpY] = userConfig.totalPricePos;
            doc.text(`${pricing.total.toLocaleString()} Kč`, tpX, tpY);

            // 2. TEXTOVÁ POLE (Zákazník, Auto, atd.)
            Object.entries(userConfig.txtPos).forEach(([key, [x, y]]) => {
                if (formData[key] && !userConfig.hiddenFields.includes(key)) {
                    let valueToDisplay = formData[key];
                    if (key === 'serviceDate')
                        valueToDisplay = formatCzechDate(formData[key]);

                    if (key === 'notes' && formData.detailNotes) {
                        const splitNotes = doc.splitTextToSize(
                            formData.detailNotes,
                            60,
                        );
                        doc.text(splitNotes, x, y);
                    } else if (key !== 'notes') {
                        doc.text(`${valueToDisplay}`, x, y);
                    }
                }
            });

            // 3. KONTAKT NA TECHNIKA (Editor ho může v PDF potřebovat taky)
            if (userConfig.showExtraContact) {
                if (formData.technicianName)
                    doc.text(`${formData.technicianName}`, 133, 247);
                if (formData.technicianPhone)
                    doc.text(`Tel: ${formData.technicianPhone}`, 133, 251);
                if (formData.technicianMail)
                    doc.text(`Email: ${formData.technicianMail}`, 133, 256);
            }

            // 4. TABULKA POŠKOZENÍ
            let currentY = userConfig.tableStartY;
            const startX = 14;
            const col = {
                label: 40,
                count: 10,
                diam: 20,
                lak: 15,
                alu: 15,
                vym: 15,
            };

            // Filtrujeme všechny aktivní díly (včetně ADDITIONAL_DAMAGES)
            const activeDamages = [...CAR_PARTS, ...ADDITIONAL_DAMAGES].filter(
                (part) => (parseInt(formData[`${part.id}Count`]) || 0) > 0,
            );

            activeDamages.forEach((part) => {
                const count1 = formData[`${part.id}Count`] || 0;
                const diam1 = formData[`${part.id}Diameter`] || '-';
                const count2 = formData[`${part.id}Count2`] || 0;
                const diam2 = formData[`${part.id}Diameter2`] || '';
                const lak = formData[`${part.id}Lak`] ? 'ANO' : 'NE';
                const alu = formData[`${part.id}Alu`] ? 'ANO' : 'NE';
                const vym = formData[`${part.id}Vymena`] ? 'ANO' : 'NE';

                doc.text(`${part.label}`, startX, currentY);
                doc.text(`${count1}`, startX + col.label, currentY);
                doc.text(
                    `${diam1} mm`,
                    startX + col.label + col.count,
                    currentY,
                );
                doc.text(
                    `${lak}`,
                    startX + col.label + col.count + col.diam,
                    currentY,
                );
                doc.text(
                    `${alu}`,
                    startX + col.label + col.count + col.diam + col.lak,
                    currentY,
                );
                doc.text(
                    `${vym}`,
                    startX +
                        col.label +
                        col.count +
                        col.diam +
                        col.lak +
                        col.alu,
                    currentY,
                );

                if (count2 > 0 && diam2 !== '') {
                    currentY += 4.5;
                    doc.text(`${count2}`, startX + col.label, currentY);
                    doc.text(
                        `${diam2} mm`,
                        startX + col.label + col.count,
                        currentY,
                    );
                    currentY += 1.5;
                }
                currentY += 6.5;
            });

            doc.save(`${formData.vehicleSPZ || 'zakazka'}.pdf`);
        };
    };

    return (
        <div className="max-w-6xl mx-auto p-4 min-h-screen pb-4" key={formKey}>
            <div className="flex flex-col items-center mb-8 bg-white ">
                <h2 className="w-full text-2xl font-black text-maingreen uppercase">
                    Editace zakázky
                </h2>
                <div className="flex justify-between flex-row w-full mt-4">
                    <button
                        onClick={() => router.push('/splitter')}
                        className="px-4 py-2 text-md font-bold border border-gray-600 rounded text-gray-600 hover:text-maingreen"
                    >
                        Zpět na rozcestník
                    </button>
                    <label className="bg-maingreen text-white px-4 py-2 rounded-md cursor-pointer font-bold shadow-md">
                        Importovat zakázku
                        <input
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={handleImport}
                        />
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div className="bg-white p-4 rounded-lg border space-y-4 shadow-sm">
                    <h2 className="font-bold text-maingreen border-b pb-2 uppercase text-xl ">
                        Informace o vozidle
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput
                            label="SPZ"
                            name="vehicleSPZ"
                            value={formData.vehicleSPZ}
                            onChange={handleFieldChange}
                        />
                        <FormInput
                            label="Značka"
                            name="vehicleBrand"
                            type="select"
                            options={VEHICLE_BRANDS}
                            value={formData.vehicleBrand}
                            onChange={handleFieldChange}
                        />
                        <FormInput
                            label="Model"
                            name="vehicleType"
                            value={formData.vehicleType}
                            onChange={handleFieldChange}
                        />
                        <FormInput
                            label="Barva"
                            name="vehicleColor"
                            value={formData.vehicleColor}
                            onChange={handleFieldChange}
                        />
                        <FormInput
                            label="VIN"
                            name="vehicleVIN"
                            value={formData.vehicleVIN}
                            onChange={handleFieldChange}
                        />
                        <FormInput
                            label="Rok výroby"
                            name="vehicleYear"
                            value={formData.vehicleYear}
                            onChange={handleFieldChange}
                        />
                        <FormInput
                            label="Stav tachometru"
                            name="vehicleDistance"
                            value={formData.vehicleDistance}
                            onChange={handleFieldChange}
                        />
                        <FormInput
                            label="Jméno zákazníka"
                            name="customerName"
                            value={formData.customerName}
                            onChange={handleFieldChange}
                        />
                        <FormInput
                            label="Telefon"
                            name="customerPhone"
                            value={formData.customerPhone}
                            onChange={handleFieldChange}
                        />
                        <FormInput
                            label="Adresa"
                            name="customerAddress"
                            value={formData.customerAddress}
                            onChange={handleFieldChange}
                        />
                        <FormInput
                            label="Datum servisní prohlídky"
                            name="serviceDate"
                            type="date"
                            value={formData.serviceDate}
                            onChange={handleFieldChange}
                        />
                        <FormInput
                            label="Pojišťovna"
                            name="insuranceCompany"
                            value={formData.insuranceCompany}
                            onChange={handleFieldChange}
                        />
                        <FormInput
                            label="Číslo pojistky"
                            name="insuranceNumber"
                            value={formData.insuranceNumber}
                            onChange={handleFieldChange}
                        />
                    </div>
                    <textarea
                        name="detailNotes"
                        placeholder="Poznámky pro PDF..."
                        className="w-full p-3 border rounded-lg text-sm min-h-[150px] bg-slate-50 focus:ring-2 focus:ring-maingreen outline-none"
                        value={formData.detailNotes}
                        onChange={handleFieldChange}
                    />
                </div>

                <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h2 className="font-bold text-maingreen border-b pb-2 uppercase text-xl ">
                        Opravované díly
                    </h2>
                    <div className="max-h-[60vh] overflow-y-auto pr-2">
                        {[...CAR_PARTS, ...ADDITIONAL_DAMAGES].map((part) => {
                            const orderIndex = activePartsSorted.findIndex(
                                (p) => p.id === part.id,
                            );

                            // Zobrazíme díl, pokud má nějakou cenu nebo je to první extra pole
                            const isVisible =
                                realPartPrices[part.id] > 0 ||
                                part.id === 'kapota' ||
                                part.id === 'extra1';

                            if (!isVisible) return null;

                            return (
                                <FormPart
                                    key={part.id}
                                    id={part.id}
                                    label={part.label}
                                    formData={formData}
                                    onImageChange={() => {}}
                                    onChange={handleFieldChange}
                                    onCheckboxChange={handleFieldChange}
                                    onRemoveImage={() => {}}
                                    realPrice={realPartPrices[part.id] || 0}
                                    damageOrder={orderIndex}
                                    isGlobalMode={isGlobalMode}
                                    hidePhotos={true}
                                />
                            );
                        })}
                    </div>

                    <div className="mt-6 pt-4 border-t flex justify-between items-center">
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase ">
                                Konečná cena:
                            </span>
                            <div className="text-3xl font-black text-maingreen leading-none">
                                {pricing.total.toLocaleString()} Kč
                            </div>
                        </div>
                        <button
                            onClick={handleGeneratePDF}
                            className="bg-maingreen text-white px-6 py-3 rounded-lg font-black uppercase hover:bg-green-700 shadow-xl"
                        >
                            Vygenerovat PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
