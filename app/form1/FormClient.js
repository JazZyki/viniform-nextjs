'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Popup from 'reactjs-popup';
import SignatureCanvas from 'react-signature-canvas';
import { robotoBase64 } from '../../lib/fonts/Roboto-Condensed-normal';
import { calculatePartPrice } from '../../lib/priceCalculator';
import { CAR_PARTS, VEHICLE_BRANDS } from './config';
import FormPart from './FormParts';
import {
    saveToBackup,
    autoCleanup,
    clearAllDrafts,
    finalizeOrder,
    getAllArchivedOrders,
    exportOrderToJson,
} from '../../lib/storage';
import { keys, get, del } from 'idb-keyval';
import { FormInput } from './FormInput';
import { ImagePreview } from './ImagePreview';

export default function FormPage({ initialTechnician }) {
    const FIELD_LABELS = {
        zapisOPoskozeni: 'Zápis o poškození',
        pohledZePredu: 'Pohled zepředu (1)',
        pohledZePreduZleva: 'Pohled zepředu zleva (2)',
        pohledZleva: 'Pohled zleva (3)',
        pohledZezaduZleva: 'Pohled zezadu zleva (4)',
        pohledZezadu: 'Pohled zezadu (5)',
        pohledZezaduZprava: 'Pohled zezadu zprava (6)',
        pohledZprava: 'Pohled zprava (7)',
        pohledZepreduZprava: 'Pohled zepředu zprava (8)',
        STK: 'STK',
        VIN: 'VIN kód',
        tachometr: 'Tachometr',
        interier: 'Interiér',
    };

    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const signatureRef = useRef(null);
    const [signatureImage, setSignatureImage] = useState(null);
    const [archivedOrders, setArchivedOrders] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    //const userTechnician = technician();

    // --- 1. KOMPLETNÍ INICIALIZACE STAVU ---
    const createInitialState = () => {
        const today = new Date().toISOString().split('T')[0];
        const state = {
            // Krok 1: Údaje
            technician: '',
            vehicleBrand: '',
            vehicleType: '',
            vehicleSPZ: '',
            vehicleVIN: '',
            vehicleColor: '',
            vehicleYear: '',
            vehicleDistance: '',
            insuranceCompany: '',
            insuranceNumber: '',
            customerName: '',
            customerAddress: '',
            customerPhone: '',
            serviceDate: today,
            hailsDiameter: '',
            contractMD: '',
            contractPaint: '',
            detailNotes: '',
            globalPhotographyNotes: '',
            globalPhotographyNotes2: '',

            // Krok 2: Globální fotky
            zapisOPoskozeni: Array(3).fill(''),
            pohledZePredu: Array(3).fill(''),
            pohledZePreduZleva: Array(3).fill(''),
            pohledZleva: Array(3).fill(''),
            pohledZezaduZleva: Array(3).fill(''),
            pohledZezadu: Array(3).fill(''),
            pohledZezaduZprava: Array(3).fill(''),
            pohledZprava: Array(3).fill(''),
            pohledZepreduZprava: Array(3).fill(''),
            STK: Array(3).fill(''),
            VIN: Array(3).fill(''),
            tachometr: Array(3).fill(''),
            interier: Array(3).fill(''),
            dodatecneFoto1: Array(10).fill(''),
            dodatecneFoto2: Array(10).fill(''),
        };

        // Krok 3: Dynamické díly
        CAR_PARTS.forEach((part) => {
            state[part.id] = Array(10).fill('');
            state[`${part.id}Count`] = 0;
            state[`${part.id}Diameter`] = '';
            state[`${part.id}Lak`] = false;
            state[`${part.id}Vymena`] = false;
        });

        return state;
    };

    const [formData, setFormData] = useState(createInitialState());
    const [userRole, setUserRole] = useState('');
    const isAdminOrEditor = userRole === 'admin' || userRole === 'editor';

    useEffect(() => {
        async function initApp() {
            const role = localStorage.getItem('userRole') || '';
            setUserRole(role);
            // Nejprve vyčistíme staré věci
            await autoCleanup();

            // Pak zjistíme jméno technika z login
            const loggedTechnician =
                localStorage.getItem('username') || initialTechnician || '';

            // Pak zkusíme najít zálohu
            const allKeys = await keys();
            const backupKey = allKeys.find((k) => k.startsWith('draft_'));

            if (backupKey) {
                const entry = await get(backupKey);
                const savedData = entry?.data;

                if (savedData) {
                    // Použijeme confirm pro obnovu
                    if (
                        window.confirm(
                            `Nalezena rozpracovaná zakázka (${
                                savedData.vehicleSPZ || 'bez SPZ'
                            }). Chcete ji obnovit?`
                        )
                    ) {
                        setFormData(savedData);
                        if (savedData.step) setStep(savedData.step);
                        return; // Končíme, data jsou obnovena i s technikem
                    } else {
                        await del(backupKey);
                    }
                }
            }

            // Pokud nebyla záloha nebo ji uživatel nechtěl, nastavíme aspoň technika
            setFormData((prev) => ({ ...prev, technician: loggedTechnician }));
        }

        initApp();
    }, [initialTechnician]);

    // Handlery
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const newState = { ...prev, [name]: value };

            // Zálohujeme jen pokud už máme aspoň kousek SPZ
            if (newState.vehicleSPZ) {
                saveToBackup(newState.vehicleSPZ.trim(), newState);
            }

            return newState;
        });
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: checked }));
    };

    const processAndCompressImage = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onerror = (err) => reject(err);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Max rozlišení 1600px
                    const MAX_SIZE = 1600;
                    if (width > height && width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    } else if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Chyba při kompresi'));
                                return;
                            }
                            resolve(
                                new File([blob], file.name, {
                                    type: 'image/jpeg',
                                })
                            );
                        },
                        'image/jpeg',
                        0.7
                    );
                };
            };
        });
    };

    const removeImage = async (field, index) => {
        const currentPhotos = [...formData[field]];
        currentPhotos.splice(index, 1);

        const maxLength =
            field.startsWith('dodatecne') ||
            CAR_PARTS.some((p) => p.id === field)
                ? 10
                : 3;
        while (currentPhotos.length < maxLength) {
            currentPhotos.push('');
        }

        const newState = { ...formData, [field]: currentPhotos };
        setFormData(newState);

        if (newState.vehicleSPZ) {
            await saveToBackup(newState.vehicleSPZ.trim(), newState);
        }
    };

    const handleImageChange = async (field, index, file) => {
        if (!file) return;

        try {
            // 1. KOMPRESE (zmenšíme fotku hned, aby nezabírala RAM)
            const compressedFile = await processAndCompressImage(file);

            // 2. AKTUALIZACE STAVU A ZÁLOHA
            setFormData((prev) => {
                const updatedImages = [...prev[field]];
                updatedImages[index] = compressedFile;
                const newState = { ...prev, [field]: updatedImages };

                // 3. AUTOMATICKÁ ZÁLOHA DO INDEXEDDB
                // Použijeme SPZ jako klíč, nebo "temp_draft", pokud SPZ ještě není vyplněná
                const backupId = newState.vehicleSPZ?.trim() || 'temp_draft';

                // Voláme exportovanou funkci ze storage.js
                saveToBackup(backupId, newState);

                return newState;
            });
        } catch (error) {
            console.error('Chyba při zpracování fotky:', error);
            alert(
                'Nepodařilo se zpracovat fotografii. Zkuste to prosím znovu.'
            );
        }
    };

    const logSignature = (close) => {
        if (signatureRef.current) {
            const canvas = signatureRef.current.getCanvas();
            const context = canvas.getContext('2d');
            const originalImage = context.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            );
            context.globalCompositeOperation = 'destination-over';
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            setSignatureImage(dataUrl);
            context.putImageData(originalImage, 0, 0);
            close();
        }
    };

    const getGrandTotal = () => {
        let baseSum = 0;
        CAR_PARTS.forEach((part) => {
            // TADY byla asi chyba - musíš použít part.id, ne jen id
            const count = parseInt(formData[`${part.id}Count`]) || 0;
            const diameter = formData[`${part.id}Diameter`];

            const partPrice = calculatePartPrice(
                count,
                diameter,
                part.category, // oprava z category na part.category
                formData[`${part.id}Alu`],
                formData[`${part.id}Lak`]
            );

            baseSum += partPrice;
        });

        const fee = baseSum * 0.02;
        return {
            base: Math.round(baseSum),
            fee: Math.round(fee),
            total: Math.round(baseSum + fee),
        };
    };

    const pricing = getGrandTotal();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (step < 3) {
            setStep((s) => s + 1);
            window.scrollTo(0, 0);
            return;
        }

        setLoading(true);
        const filename = `${formData.vehicleSPZ}_${formData.customerName}`;
        const doc = new jsPDF();
        doc.addFileToVFS('Roboto-Condensed.ttf', robotoBase64);
        doc.addFont('Roboto-Condensed.ttf', 'RobotoCustom', 'normal');

        const backgroundImage = new Image();
        backgroundImage.src = '/zakazkovy_list.jpg';
        const pricing = getGrandTotal();

        backgroundImage.onload = async () => {
            doc.addImage(backgroundImage, 'PNG', 0, 0, 210, 297);

            doc.setFont('RobotoCustom');
            doc.setFontSize(13); // Nastav velikost písma

            doc.text(`${pricing.total.toLocaleString()} Kč`, 14, 246);

            // Mapování textů do PDF (Dle tvých pozic)
            const txtPos = {
                technician: [133, 246],
                customerName: [14, 52],
                customerPhone: [122, 52],
                vehicleBrand: [14, 65],
                vehicleType: [65, 65],
                vehicleSPZ: [122, 65],
                vehicleVIN: [14, 80],
                vehicleDistance: [107, 80],
                vehicleYear: [136, 80],
                vehicleColor: [165, 80],
                insuranceCompany: [14, 93],
                insuranceNumber: [88, 93],
                serviceDate: [154, 93],
            };

            Object.entries(txtPos).forEach(([key, [x, y]]) => {
                if (formData[key]) doc.text(`${formData[key]}`, x, y);
            });

            // Dynamické vykreslení dílů z config.js
            CAR_PARTS.forEach((part) => {
                const count = formData[`${part.id}Count`];
                const diam = formData[`${part.id}Diameter`];
                if (count > 0) doc.text(`${count}`, part.x, part.y);
                if (diam) doc.text(`${diam}`, part.x + 25, part.y);
                if (formData[`${part.id}Lak`]) doc.text('X', part.lakX, part.y);
                if (formData[`${part.id}Vymena`])
                    doc.text('X', part.vymenaX, part.y);
            });

            if (signatureImage)
                doc.addImage(signatureImage, 'PNG', 35, 266, 50, 20);

            // Poznámky (splitTextToSize pro zalomení řádků)
            if (formData.detailNotes) {
                const splitNotes = doc.splitTextToSize(
                    formData.detailNotes,
                    60
                );
                doc.text(splitNotes, 134, 137);
            }

            const pdfBlob = doc.output('blob');
            const zip = new JSZip();
            zip.file(`${filename}.pdf`, pdfBlob);

            // Fotky do ZIPu
            const photoFields = [
                'zapisOPoskozeni',
                'pohledZePredu',
                'pohledZePreduZleva',
                'pohledZleva',
                'pohledZezaduZleva',
                'pohledZezadu',
                'pohledZezaduZprava',
                'pohledZprava',
                'pohledZepreduZprava',
                'STK',
                'VIN',
                'tachometr',
                'interier',
                ...CAR_PARTS.map((p) => p.id),
            ];

            for (const field of photoFields) {
                for (let i = 0; i < formData[field].length; i++) {
                    const img = formData[field][i];
                    if (img instanceof File) {
                        zip.file(`${field}_${i + 1}.jpg`, img);
                    }
                }
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            saveAs(zipBlob, `${filename}.zip`);
            const finalSPZ = formData.vehicleSPZ.trim();
            if (finalSPZ) {
                await finalizeOrder(finalSPZ, formData);
            } else {
                await clearAllDrafts();
            }
            setLoading(false);
            alert('Hotovo!');
        };
    };

    const isStep1Valid = () => {
        const requiredFields = [
            'vehicleBrand',
            'vehicleType',
            'vehicleSPZ',
            'vehicleVIN',
            'vehicleColor',
            'vehicleYear',
            'vehicleDistance',
            'insuranceCompany',
            'insuranceNumber',
            'customerName',
            'customerAddress',
        ];

        return requiredFields.every(
            (field) =>
                formData[field] && formData[field].toString().trim() !== ''
        );
    };

    const isStep2Valid = () => {
        // Seznam polí, která musí mít alespoň jednu fotku
        const requiredFields = [
            'zapisOPoskozeni',
            'pohledZePredu',
            'pohledZePreduZleva',
            'pohledZleva',
            'pohledZezaduZleva',
            'pohledZezadu',
            'pohledZezaduZprava',
            'pohledZprava',
            'pohledZepreduZprava',
            'STK',
            'VIN',
            'tachometr',
            'interier',
        ];

        // Zkontrolujeme, zda každé pole má alespoň jeden prvek, který je File
        return requiredFields.every((field) =>
            formData[field].some((img) => img instanceof File)
        );
    };

    const isStep3Valid = () => {
        return CAR_PARTS.every((part) => {
            const images = formData[part.id] || [];
            return images.some((img) => img instanceof File);
        });
    };

    // Načtení historie při kliknutí na tlačítko
    const handleLoadHistory = async () => {
        const orders = await getAllArchivedOrders();
        setArchivedOrders(orders);
        setShowHistory(!showHistory);
    };

    // Načtení konkrétní zakázky z historie
    const loadOrderFromArchive = (orderData) => {
        if (
            window.confirm(
                'Opravdu chcete načíst tuto zakázku? Přepíšete aktuálně rozpracovaná data.'
            )
        ) {
            setFormData(orderData);
            setStep(1); // Vrátíme se na začátek pro kontrolu
            setShowHistory(false);
        }
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (
                    window.confirm(
                        'Importovat data? Aktuální formulář bude přepsán.'
                    )
                ) {
                    setFormData(importedData);
                    alert('Data byla úspěšně importována.');
                }
            } catch (err) {
                alert('Chyba: Neplatný formát souboru.');
            }
        };
        reader.readAsText(file);
    };

    const isSpzReady = formData.vehicleSPZ?.trim().length >= 3;

    return (
        <div className="max-w-4xl mx-auto p-4 bg-white min-h-screen">
            <div className="flex justify-between mb-8">
                {[1, 2, 3].map((s) => (
                    <div
                        key={s}
                        className={`flex-1 text-center py-2 border-b-4 ${
                            step === s
                                ? 'border-maingreen font-bold uppercase'
                                : 'border-gray-200 uppercase'
                        }`}
                    >
                        {s === 1 ? 'Údaje' : s === 2 ? 'Foto' : 'Díly'}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="pb-24">
                {step === 1 && (
                    <div className="flex flex-col">
                        <div className="flex flex-wrap items-center gap-2 mb-6 p-2 bg-slate-100 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between w-full">
                                <button
                                    onClick={() => router.push('/splitter')} // Uprav cestu dle potřeby
                                    className="px-4 py-2 text-md font-bold border border-gray-600 rounded text-gray-600 hover:text-maingreen hover:border-maingreen transition-colors"
                                >
                                    Zpět na rozcestník
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={handleLoadHistory}
                                        className="bg-maingreen text-white px-4 py-2 rounded text-md font-bold shadow-sm hover:bg-green-700 transition-all"
                                    >
                                        Historie zakázek
                                    </button>
                                    {/* Dropdown / Select menu pro historii */}
                                    {showHistory && (
                                        <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-300 rounded-xl shadow-2xl z-[100] max-h-96 overflow-y-auto">
                                            <div className="p-3 border-b bg-slate-50 font-bold text-xs uppercase text-gray-500">
                                                Archiv (posledních 30 dní)
                                            </div>
                                            {archivedOrders.length === 0 ? (
                                                <div className="p-4 text-sm text-gray-400 text-center italic">
                                                    Žádné zakázky nenalezeny
                                                </div>
                                            ) : (
                                                archivedOrders.map((order) => (
                                                    <div
                                                        key={order.id}
                                                        onClick={() =>
                                                            loadOrderFromArchive(
                                                                order.data
                                                            )
                                                        }
                                                        className="p-3 border-b hover:bg-green-50 cursor-pointer transition-colors"
                                                    >
                                                        <div className="font-bold text-maingreen">
                                                            {order.id}
                                                        </div>
                                                        <div className="text-[10px] text-gray-500">
                                                            {new Date(
                                                                order.timestamp
                                                            ).toLocaleString(
                                                                'cs-CZ'
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-gray-600 truncate">
                                                            {order.data
                                                                .customerName ||
                                                                'Bez jména'}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between w-full">
                                <button
                                    onClick={() => exportOrderToJson(formData)}
                                    className="text-sm bg-white border text-maingreen border-maingreen px-3 py-1.5 rounded hover:bg-green-100 flex items-center gap-1 shadow-sm"
                                    title="Exportovat textová data do JSON"
                                >
                                    Export
                                </button>
                                {isAdminOrEditor && (
                                    <label className="text-sm bg-white border text-maingreen border-maingreen px-3 py-1.5 rounded hover:bg-green-100 cursor-pointer flex items-center gap-1 shadow-sm">
                                        Import
                                        <input
                                            type="file"
                                            accept=".json"
                                            className="hidden"
                                            onChange={handleImport}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <h2 className="text-lg font-bold mb-4 text-maingreen uppercase tracking-wide border-b pb-2">
                                    Vozidlo a Technik
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput
                                        label="Technik (přihlášen)"
                                        name="technician"
                                        type="text"
                                        value={formData.technician}
                                        readOnly
                                        disabled={true}
                                    />
                                    <FormInput
                                        label="SPZ"
                                        name="vehicleSPZ"
                                        value={formData.vehicleSPZ}
                                        onChange={handleChange}
                                        required
                                    />
                                    <FormInput
                                        label="Značka vozidla"
                                        name="vehicleBrand"
                                        type="select"
                                        options={VEHICLE_BRANDS}
                                        value={formData.vehicleBrand}
                                        onChange={handleChange}
                                        required
                                        disabled={!isSpzReady}
                                        placeholder="Vyberte..."
                                    />
                                    <FormInput
                                        label="Model (Druh)"
                                        name="vehicleType"
                                        value={formData.vehicleType}
                                        onChange={handleChange}
                                        required
                                        disabled={!isSpzReady}
                                    />
                                    <FormInput
                                        label="VIN"
                                        name="vehicleVIN"
                                        value={formData.vehicleVIN}
                                        onChange={handleChange}
                                        required
                                        disabled={!isSpzReady}
                                    />
                                    <FormInput
                                        label="Barva"
                                        name="vehicleColor"
                                        value={formData.vehicleColor}
                                        onChange={handleChange}
                                        required
                                        disabled={!isSpzReady}
                                    />
                                    <FormInput
                                        label="Rok výroby"
                                        name="vehicleYear"
                                        value={formData.vehicleYear}
                                        onChange={handleChange}
                                        required
                                        disabled={!isSpzReady}
                                    />
                                    <FormInput
                                        label="Stav tachometru (km)"
                                        name="vehicleDistance"
                                        type="number"
                                        value={formData.vehicleDistance}
                                        onChange={handleChange}
                                        required
                                        disabled={!isSpzReady}
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border">
                                <h2 className="text-lg font-bold mb-4 text-maingreen uppercase tracking-wide border-b pb-2">
                                    Zákazník a Pojišťovna
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput
                                        label="Jméno zákazníka"
                                        name="customerName"
                                        value={formData.customerName}
                                        onChange={handleChange}
                                        required
                                        disabled={!isSpzReady}
                                    />
                                    <FormInput
                                        label="Telefon"
                                        name="customerPhone"
                                        type="tel"
                                        value={formData.customerPhone}
                                        onChange={handleChange}
                                        disabled={!isSpzReady}
                                    />
                                    <FormInput
                                        label="Adresa"
                                        name="customerAddress"
                                        value={formData.customerAddress}
                                        onChange={handleChange}
                                        required
                                        disabled={!isSpzReady}
                                        fullWidth={true}
                                    />
                                    <FormInput
                                        label="Pojišťovna"
                                        name="insuranceCompany"
                                        type="select"
                                        options={[
                                            'Allianz',
                                            'AXA',
                                            'ČPP',
                                            'ČSOB Pojišťovna',
                                            'Direct',
                                            'Generali',
                                            'Kooperativa',
                                            'Pillow',
                                            'Servisní pojišťovna',
                                            'Slavia',
                                            'VZP',
                                            'Ostatní',
                                        ]}
                                        value={formData.insuranceCompany}
                                        onChange={handleChange}
                                        required
                                        disabled={!isSpzReady}
                                        placeholder="Vyberte..."
                                    />
                                    <FormInput
                                        label="Číslo pojistné události"
                                        name="insuranceNumber"
                                        value={formData.insuranceNumber}
                                        onChange={handleChange}
                                        required
                                        disabled={!isSpzReady}
                                    />
                                    <FormInput
                                        label="Datum přijetí"
                                        name="serviceDate"
                                        type="date"
                                        value={formData.serviceDate}
                                        onChange={handleChange}
                                        disabled={!isSpzReady}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <img
                            src="/auto_global.svg"
                            alt="Auto"
                            className="w-full max-w-sm mx-auto"
                        />
                        <div className="space-y-4">
                            {Object.keys(FIELD_LABELS).map((field) => {
                                const photos = formData[field] || [];
                                // Filtrujeme jen ty, co jsou soubory
                                const filledPhotos = photos.filter(
                                    (img) => img instanceof File
                                );
                                const hasNoImage = filledPhotos.length === 0;
                                // Zobrazíme buď všechny nahrané + 1 volný slot, nebo max 3
                                const visibleCount = Math.min(
                                    filledPhotos.length + 1,
                                    3
                                );

                                return (
                                    <div
                                        key={field}
                                        className="border p-4 rounded-md border-secondarygreen bg-gray-50 shadow-sm mb-4"
                                    >
                                        <div className="mb-4 flex items-center justify-between">
                                            <p className="font-bold text-lg uppercase text-maingreen pb-1">
                                                {FIELD_LABELS[field]}
                                            </p>
                                            {hasNoImage && (
                                                <span className="text-[#8f2215] text-[10px] font-black uppercase tracking-tighter">
                                                    ⚠ Povinná fotografie
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 items-end">
                                            {[...Array(visibleCount)].map(
                                                (_, i) => {
                                                    const currentFile =
                                                        photos[i];
                                                    const isFile =
                                                        currentFile instanceof
                                                        File;

                                                    return (
                                                        <div
                                                            key={i}
                                                            className="flex flex-col gap-2"
                                                        >
                                                            {isFile ? (
                                                                // POKUD FOTKA JE: Ukážeme náhled
                                                                <ImagePreview
                                                                    file={
                                                                        currentFile
                                                                    }
                                                                    onRemove={() =>
                                                                        removeImage(
                                                                            field,
                                                                            i
                                                                        )
                                                                    } // Použije nový asynchronní handler
                                                                />
                                                            ) : (
                                                                // POKUD FOTKA NENÍ: Ukážeme input
                                                                <div className="w-full col-span-3">
                                                                    <label className="w-full h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-white hover:border-maingreen cursor-pointer transition-colors">
                                                                        <span className="text-2xl text-gray-400">
                                                                            +
                                                                        </span>
                                                                        <span className="text-[10px] text-gray-400 font-bold">
                                                                            FOTO
                                                                        </span>
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*;capture=camera"
                                                                            className="hidden"
                                                                            //capture="camera"
                                                                            onChange={(
                                                                                e
                                                                            ) =>
                                                                                handleImageChange(
                                                                                    field,
                                                                                    i,
                                                                                    e
                                                                                        .target
                                                                                        .files[0]
                                                                                )
                                                                            }
                                                                        />
                                                                    </label>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <img
                            src="/auto_details.svg"
                            alt="Auto detaily"
                            className="w-full max-w-sm mx-auto mb-8"
                        />
                        {CAR_PARTS.map((part) => (
                            <FormPart
                                key={part.id}
                                id={part.id}
                                label={part.label}
                                category={part.category}
                                formData={formData}
                                onImageChange={handleImageChange}
                                onChange={handleChange}
                                onCheckboxChange={handleCheckboxChange}
                                onRemoveImage={removeImage}
                            />
                        ))}

                        <div className="mt-8 bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <label className="block">
                                <span className="text-sm font-bold text-maingreen uppercase tracking-wider">
                                    Detailní poznámky k zakázce
                                </span>
                                <textarea
                                    name="detailNotes"
                                    value={formData.detailNotes || ''}
                                    onChange={handleChange}
                                    placeholder="Zde uveďte další poškození, specifika opravy nebo domluvu se zákazníkem..."
                                    className="w-full mt-2 p-3 border rounded-lg shadow-inner min-h-[120px] focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                    maxLength={500}
                                />
                            </label>
                        </div>

                        <div className="mt-8 border border-maingreen pt-6 bg-slate-50 p-4 rounded-xl">
                            <h3 className="font-bold mb-4">Podpis zákazníka</h3>
                            <Popup
                                modal
                                trigger={
                                    <button
                                        type="button"
                                        className="w-full btn btn-primary  font-bold"
                                    >
                                        Otevřít podpis
                                    </button>
                                }
                                closeOnDocumentClick={false}
                            >
                                {(close) => (
                                    <div className="bg-white p-4 rounded border">
                                        <SignatureCanvas
                                            ref={signatureRef}
                                            penColor="black"
                                            canvasProps={{
                                                width: 400,
                                                height: 200,
                                                className: 'border w-full',
                                            }}
                                        />
                                        <div className="flex gap-4 mt-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    logSignature(close)
                                                }
                                                className="flex-1 p-2 bg-green-700 text-white rounded"
                                            >
                                                Vložit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    signatureRef.current.clear()
                                                }
                                                className="flex-1 p-2 bg-gray-200 rounded"
                                            >
                                                Smazat
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </Popup>
                            {signatureImage && (
                                <img
                                    src={signatureImage}
                                    alt="Podpis"
                                    className="mt-4 border h-20 mx-auto"
                                />
                            )}
                        </div>
                        {isAdminOrEditor && (
                            <div className="mt-10 p-6 bg-green-50 rounded-xl border-2 border-maingreen">
                                <h3 className="text-lg font-bold text-maingreen mb-2 uppercase tracking-tight">
                                    Souhrn kalkulace
                                </h3>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-gray-600">
                                        <span>Základní oprava:</span>
                                        <span>
                                            {pricing.base.toLocaleString()} Kč
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-gray-600">
                                        <span>Režijní materiál (2%):</span>
                                        <span>
                                            {pricing.fee.toLocaleString()} Kč
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xl font-black text-maingreen border-t pt-2 mt-2">
                                        <span>CELKEM BEZ DPH:</span>
                                        <span>
                                            {pricing.total.toLocaleString()} Kč
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Fixní lišta s navigací */}
                <div className="fixed max-w-md bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-between gap-4 max-w-4xl mx-auto shadow-lg z-50">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={() => setStep((s) => s - 1)}
                            className="btn btn-secondary flex-1"
                        >
                            Zpět
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={
                            loading ||
                            (step === 1 && !isStep1Valid()) ||
                            (step === 2 && !isStep2Valid()) ||
                            (step === 3 && !isStep3Valid())
                        }
                        className={`btn flex-1 font-bold text-white rounded ${
                            loading ||
                            (step === 2 && !isStep2Valid()) ||
                            (step === 1 && !isStep1Valid()) ||
                            (step === 3 && !isStep3Valid())
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-[#168E33] hover:bg-[#12752a]'
                        }`}
                    >
                        {loading
                            ? 'Generuji...'
                            : step < 3
                            ? 'Další krok'
                            : 'Dokončit'}
                    </button>
                </div>
            </form>
        </div>
    );
}
