'use client';
import { useState } from 'react';
import { FormInput } from '../form1/FormInput';
import { CAR_PARTS, VEHICLE_BRANDS } from '../form1/config';
import { calculatePartPrice } from '../../lib/priceCalculator';
import { generateFinalPDF } from '../../lib/pdfGenerator';
import { useRouter } from 'next/navigation';

export default function CalculatorPage() {
    // 1. Přidáme klíč pro vynucení re-renderu celého formu
    const [formKey, setFormKey] = useState(Date.now());

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
        };
        CAR_PARTS.forEach((part) => {
            state[`${part.id}Count`] = 0;
            state[`${part.id}Diameter`] = '';
            state[`${part.id}Alu`] = false;
            state[`${part.id}Lak`] = false;
            state[`${part.id}Vymena`] = false;
        });
        return state;
    };

    const [formData, setFormData] = useState(createInitialState());

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);

                // Vyčištění polí fotek (protože JSON tam má "[Soubor]", což nechceme)
                // Ponecháme jen textové a logické hodnoty
                const cleanedData = {};
                Object.keys(importedData).forEach((key) => {
                    if (!Array.isArray(importedData[key])) {
                        cleanedData[key] = importedData[key];
                    }
                });

                setFormData({
                    ...createInitialState(),
                    ...cleanedData,
                });

                // 2. Tady je ten trik: změníme klíč, čímž React překreslí celou stránku
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

    const getPricing = () => {
        let baseSum = 0;
        CAR_PARTS.forEach((part) => {
            const count = parseInt(formData[`${part.id}Count`]) || 0;
            const diam = formData[`${part.id}Diameter`];
            const alu = formData[`${part.id}Alu`];
            const lak = formData[`${part.id}Lak`];

            baseSum += calculatePartPrice(count, diam, part.category, alu, lak);
        });
        // Přidáme 2% režii
        const total = Math.round(baseSum * 1.02);
        return { total };
    };

    const pricing = getPricing();
    const router = useRouter();

    return (
        <div className="max-w-6xl mx-auto p-4 min-h-screen pb-4" key={formKey}>
            {/* TOOLBAR */}
            <div className="flex flex-col items-center mb-8 bg-white ">
                <h2 className="w-full text-2xl font-black text-maingreen uppercase">
                    Editace zakázky
                </h2>
                <div className="flex justify-between flex-row w-full">
                    <button
                        onClick={() => router.push('/splitter')} // Uprav cestu dle potřeby
                        className="px-4 py-2 text-md font-bold border border-gray-600 rounded text-gray-600 hover:text-maingreen hover:border-maingreen transition-colors"
                    >
                        Zpět na rozcestník
                    </button>
                    <div className="flex gap-2">
                        <label className="bg-maingreen text-white px-4 py-2 rounded-md cursor-pointer font-bold text-md hover:bg-blue-700 shadow-md">
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
            </div>

            <div className="flex flex-col gap-6">
                {/* INFO O AUTĚ */}
                <div className="bg-white p-3 rounded-lg border space-y-4 h-fit">
                    <h2 className="font-bold text-maingreen border-b pb-2 uppercase text-xl ">
                        Informace o vozidle
                    </h2>
                    <FormInput
                        label="SPZ"
                        name="vehicleSPZ"
                        value={formData.vehicleSPZ}
                        onChange={handleFieldChange}
                        className="border-maingreen"
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
                        label="Zákazník"
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
                        label="Barva"
                        name="vehicleColor"
                        value={formData.vehicleColor}
                        onChange={handleFieldChange}
                    />
                    <FormInput
                        label="Najeto km"
                        name="vehicleDistance"
                        value={formData.vehicleDistance}
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
                    <FormInput
                        label="Datum servisu"
                        name="serviceDate"
                        type="date"
                        value={formData.serviceDate}
                        onChange={handleFieldChange}
                    />

                    <div className="pt-4">
                        <h2 className="font-bold text-[##4d4d4d] text-sm mb-2">
                            Poznámky pro PDF
                        </h2>
                        <textarea
                            name="detailNotes"
                            className="w-full p-3 border rounded-lg text-sm min-h-[150px] bg-slate-50 focus:ring-2 focus:ring-maingreen outline-none"
                            value={formData.detailNotes}
                            onChange={handleFieldChange}
                        />
                    </div>
                </div>

                {/* TABULKA DÍLŮ */}
                <div className="bg-white p-3 rounded-lg border h-fit">
                    <h2 className="font-bold text-maingreen border-b pb-2 uppercase text-xl ">
                        Opravované díly
                    </h2>
                    {CAR_PARTS.map((part) => {
                        const price = calculatePartPrice(
                            parseInt(formData[`${part.id}Count`]) || 0,
                            formData[`${part.id}Diameter`],
                            part.category,
                            formData[`${part.id}Alu`],
                            formData[`${part.id}Lak`],
                            formData[`${part.id}Vymena`]
                        );

                        return (
                            <div
                                key={part.id}
                                className={`flex flex-row flex-wrap -mx-3 border-b transition-colors ${
                                    price > 0
                                        ? 'bg-green-50'
                                        : 'hover:bg-slate-50 opacity-60'
                                }`}
                            >
                                <div className="w-full flex justify-between px-4 py-2 items-center font-bold text-gray-700 uppercase">
                                    {part.label}
                                    <div className="py-0 px-2 text-right normal-case font-black bg-maingreen rounded-xl text-white">
                                        {price > 0
                                            ? `${price.toLocaleString()} Kč`
                                            : '-'}
                                    </div>
                                </div>
                                <div className="w-1/2 py-2 px-4">
                                    <input
                                        type="number"
                                        name={`${part.id}Count`}
                                        value={formData[`${part.id}Count`] ?? 0}
                                        onChange={handleFieldChange}
                                        className="w-full border rounded-md p-0 text-center font-bold"
                                    />
                                </div>
                                <div className="w-1/2 py-2 px-4">
                                    <select
                                        name={`${part.id}Diameter`}
                                        value={
                                            formData[`${part.id}Diameter`] ?? ''
                                        }
                                        onChange={handleFieldChange}
                                        className="w-full border rounded-md font-bold bg-white"
                                    >
                                        <option value="">-</option>
                                        <option value="20">20mm</option>
                                        <option value="30">30mm</option>
                                        <option value="40">40mm</option>
                                    </select>
                                </div>
                                <div className="p-4 flex flex-row justify-between w-full mt-2">
                                    <label className="flex items-center gap-1.5 text-sm font-black text-maingreen">
                                        <input
                                            type="checkbox"
                                            name={`${part.id}Alu`}
                                            checked={
                                                formData[`${part.id}Alu`] ||
                                                false
                                            }
                                            onChange={handleFieldChange}
                                            className="w-4 h-4 rounded border-gray-300"
                                        />{' '}
                                        Hliník (+ 20 %)
                                    </label>
                                    <label className="flex items-center gap-1.5 text-sm font-black text-maingreen">
                                        <input
                                            type="checkbox"
                                            name={`${part.id}Lak`}
                                            checked={
                                                formData[`${part.id}Lak`] ||
                                                false
                                            }
                                            onChange={handleFieldChange}
                                            className="w-4 h-4 rounded border-gray-300"
                                        />{' '}
                                        Lakování
                                    </label>
                                    <label className="flex items-center gap-1.5 text-sm font-black text-maingreen">
                                        <input
                                            type="checkbox"
                                            name={`${part.id}Vymena`}
                                            checked={
                                                formData[`${part.id}Vymena`] ||
                                                false
                                            }
                                            onChange={handleFieldChange}
                                            className="w-4 h-4 rounded border-gray-300"
                                        />{' '}
                                        Výměna
                                    </label>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ACTION BAR */}
                <div className="flex justify-between items-end ">
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase ">
                            Konečná cena:
                        </span>
                        <div className="text-3xl font-black text-maingreen leading-none">
                            {pricing.total.toLocaleString()} Kč
                        </div>
                    </div>
                    <button
                        onClick={() => generateFinalPDF(formData, pricing)}
                        className="bg-maingreen text-white px-4 py-2 rounded-lg font-black uppercase  hover:bg-green-700 transition-all shadow-xl"
                    >
                        Vygenerovat PDF
                    </button>
                </div>
            </div>
        </div>
    );
}
