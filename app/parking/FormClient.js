'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Popup from 'reactjs-popup';
import SignatureCanvas from 'react-signature-canvas';
import { robotoBase64 } from '../../lib/fonts/Roboto-Condensed-normal';
import {
    calculateDentPrice,
    calculateGlobalPartCascade,
} from '../../lib/priceCalculatorParking';
import {
    CAR_PARTS,
    VEHICLE_BRANDS,
    DENT_DIAMETERS,
    ADDITIONAL_DAMAGES,
    USER_ROLES,
} from './config';

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
import { getConfigForUser } from './config';
import NextImage from 'next/image';

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
            technicianName: '',
            technicianPhone: '',
            technicianMail: '',
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
            signatureImage: null,
            globalPhotographyNotes: '',
            globalPhotographyNotes2: '',
            submissionMethod: 'download',
            additionalEmail: '',

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
        [...CAR_PARTS, ...ADDITIONAL_DAMAGES].forEach((part) => {
            state[part.id] = Array(10).fill('');
            state[`${part.id}Count`] = 0;
            state[`${part.id}Diameter`] = '';
            state[`${part.id}Count2`] = 0;
            state[`${part.id}Diameter`] = '';
            state[`${part.id}Lak`] = false;
            state[`${part.id}Vymena`] = false;
        });

        return state;
    };

    const [formData, setFormData] = useState(createInitialState());
    const userConfig = getConfigForUser(formData.technician);
    const isGlobalMode = userConfig.isGlobal === true || ['Kooperativa', 'ČPP'].includes(formData.insuranceCompany);


    useEffect(() => {
        async function initApp() {
            if (typeof window === 'undefined') return;
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

    useEffect(() => {
        if (formData.signatureImage) {
            setSignatureImage(formData.signatureImage);
        } else {
            setSignatureImage(null);
        }
    }, [formData.signatureImage]);

    // Handlery
    const handleChange = (e) => {
        const { name, value, type } = e.target;
        let finalValue = value;

        if (type === 'number') {
            // 1. Odstraníme úvodní nuly pomocí parseInt a převedeme zpět na string nebo číslo
            // 2. Pokud je pole prázdné, nastavíme 0
            finalValue = value === '' ? 0 : parseInt(value, 10);
        }

        setFormData((prev) => {
            const newState = { ...prev, [name]: finalValue };

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

            // AKTUALIZACE FORM DATA (aby se to uložilo do DB a exportovalo)
            setFormData((prev) => {
                const newState = { ...prev, signatureImage: dataUrl };
                // Rovnou zálohujeme
                if (newState.vehicleSPZ) {
                    saveToBackup(newState.vehicleSPZ.trim(), newState);
                }
                return newState;
            });

            // Můžeš nechat i tento set pro okamžité zobrazení náhledu pod tlačítkem
            setSignatureImage(dataUrl);

            context.putImageData(originalImage, 0, 0);
            close();
        }
    };

    // Pomocná funkce pro určení reálných cen jednotlivých dílů
    const getRealPartPrices = () => {
        const allPossibleParts = [...CAR_PARTS, ...ADDITIONAL_DAMAGES];

        // Detekce Global režimu (můžeš použít i jiný klíč z configu)

        // 1. Spočítáme základní plné ceny dílů
        const calculatedParts = allPossibleParts.map((part) => {
            const basePrice = calculateDentPrice(
                formData[`${part.id}Count`],
                formData[`${part.id}Diameter`],
                formData[`${part.id}Count2`],
                formData[`${part.id}Diameter2`],
                formData[`${part.id}Alu`],
                formData[`${part.id}Lak`],
                isGlobalMode
            );
            return { id: part.id, basePrice };
        });

        // 2. Seřadíme aktivní díly od nejdražšího
        const activeParts = calculatedParts
            .filter((p) => p.basePrice > 0)
            .sort((a, b) => b.basePrice - a.basePrice);

        const realPricesMap = {};
        allPossibleParts.forEach((p) => (realPricesMap[p.id] = 0));

        if (!isGlobalMode) {
            // STANDARD: 1. díl 100%, ostatní 50% své ceny
            activeParts.forEach((part, index) => {
                realPricesMap[part.id] =
                    index === 0
                        ? part.basePrice
                        : Math.round(part.basePrice * 0.5);
            });
        } else {
            // GLOBAL: Kaskádové koeficienty aplikované na cenu konkrétního dílu
            const results = calculateGlobalPartCascade(activeParts);
            results.forEach((res) => {
                realPricesMap[res.id] = res.finalPrice;
            });
        }

        return realPricesMap;
    };

    // Tuto mapu si pak vytvoříš před renderováním
    const realPartPrices = getRealPartPrices();

    const getGrandTotal = () => {
        // Sčítáme hodnoty z naší mapy reálných cen
        const baseSum = Object.values(realPartPrices).reduce(
            (sum, price) => sum + price,
            0
        );

        if (baseSum === 0) return { base: 0, fee: 0, total: 0 };

        const fee = baseSum * 0.02;
        return {
            base: Math.round(baseSum),
            fee: Math.round(fee),
            total: Math.round(baseSum + fee),
        };
    };

    const pricing = getGrandTotal();

    const formatCzechDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('cs-CZ', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (step < 3) {
            setStep((s) => s + 1);
            window.scrollTo(0, 0);
            return;
        }

        const activeDamages = [...CAR_PARTS, ...ADDITIONAL_DAMAGES].filter(
            (part) => {
                const count = parseInt(formData[`${part.id}Count`]) || 0;
                const price = realPartPrices[part.id] || 0;
                return count > 0 && price > 0;
            }
        );

        setLoading(true);
        const filename = `${formData.vehicleSPZ || 'zakazka'}_${
            formData.customerName || 'bez-jmena'
        }`;

        const doc = new jsPDF();
        doc.addFileToVFS('Roboto-Condensed.ttf', robotoBase64);
        doc.addFont('Roboto-Condensed.ttf', 'RobotoCustom', 'normal');

        const backgroundImage = new Image();
        backgroundImage.src = userConfig.pdfBackground;
        const pricing = getGrandTotal();

        backgroundImage.onload = async () => {
            doc.addImage(backgroundImage, 'PNG', 0, 0, 210, 297);

            doc.setFont('RobotoCustom');
            doc.setFontSize(11); // Nastav velikost písma

            const [tpX, tpY] = userConfig.totalPricePos;
            doc.text(`${pricing.total.toLocaleString()} Kč`, tpX, tpY);

            Object.entries(userConfig.txtPos).forEach(([key, [x, y]]) => {
                // Vykreslíme, pokud máme data a pole není skryté
                if (formData[key] && !userConfig.hiddenFields.includes(key)) {
                    let valueToDisplay = formData[key];

                    if (key === 'serviceDate')
                        valueToDisplay = formatCzechDate(formData[key]);

                    // Detailní poznámky potřebují zalamování (Notes)
                    if (key === 'notes' && formData.detailNotes) {
                        const splitNotes = doc.splitTextToSize(
                            formData.detailNotes,
                            60
                        );
                        doc.text(splitNotes, x, y);
                    } else if (key !== 'notes') {
                        doc.text(`${valueToDisplay}`, x, y);
                    }
                }
            });

            if (userConfig.showExtraContact) {
                if (formData.technicianPhone)
                    doc.text(`Tel: ${formData.technicianPhone}`, 133, 251);
                if (formData.technicianMail)
                    doc.text(`Email: ${formData.technicianMail}`, 133, 256);
                if (formData.technicianName)
                    doc.text(`${formData.technicianName}`, 133, 247);
            }

            if (formData.signatureImage) {
                const [sX, sY, sW, sH] = userConfig.signaturePos;
                doc.addImage(formData.signatureImage, 'PNG', sX, sY, sW, sH);
            }

            const notePos = userConfig.txtPos.notes || [134, 107];
            // Poznámky (splitTextToSize pro zalomení řádků)
            if (formData.detailNotes) {
                const splitNotes = doc.splitTextToSize(
                    formData.detailNotes,
                    60
                );
                doc.text(splitNotes, notePos[0], notePos[1]);
            }

            // --- DYNAMICKÁ TABULKA POŠKOZENÍ ---
            let currentY = userConfig.tableStartY; // Začínáme na pozici z configu
            const startX = 14; // Zarovnáme k levému okraji (nebo tvých 50, pokud chceš odsazení)
            const col = {
                label: 40,
                count: 10,
                diam: 20,
                lak: 15,
                alu: 15,
                vym: 15,
            };

            // 1. Hlavička tabulky
            doc.setFont('RobotoCustom', 'normal'); // jsPDF někdy zlobí s 'bold', pokud není v base64 i tučná varianta
            doc.setFontSize(10);
            doc.setTextColor(50, 50, 50); // Tmavě šedá pro hlavičku
            doc.text('DÍL', startX, currentY);
            doc.text('KS', startX + col.label, currentY);
            doc.text('PRŮMĚR', startX + col.label + col.count, currentY);
            doc.text(
                'LAK',
                startX + col.label + col.count + col.diam,
                currentY
            );
            doc.text(
                'ALU',
                startX + col.label + col.count + col.diam + col.lak,
                currentY
            );
            doc.text(
                'VÝMĚNA',
                startX + col.label + col.count + col.diam + col.lak + col.alu,
                currentY
            );

            // Čára pod hlavičkou
            currentY += 1.5;
            doc.setLineWidth(0.6); // Nastavení tloušťky čáry (cca 2px v jspdf jednotkách)
            doc.setDrawColor(22, 142, 51); // Barva maingreen
            doc.line(
                startX,
                currentY,
                startX +
                    col.label +
                    col.count +
                    col.diam +
                    col.lak +
                    col.alu +
                    col.vym,
                currentY
            );
            currentY += 6.5; // Posun na první řádek dat

            // 2. Výpis aktivních položek
            doc.setFont('RobotoCustom', 'normal');
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0); // Černá pro data
            doc.setDrawColor(200, 200, 200); // Světle šedá pro řádky

            activeDamages.forEach((part) => {
                const count1 = formData[`${part.id}Count`] || 0;
                const diam1 = formData[`${part.id}Diameter`] || '-';
                const count2 = formData[`${part.id}Count2`] || 0;
                const diam2 = formData[`${part.id}Diameter2`] || '';

                const lak = formData[`${part.id}Lak`] ? 'ANO' : 'NE';
                const alu = formData[`${part.id}Alu`] ? 'ANO' : 'NE';
                const vym = formData[`${part.id}Vymena`] ? 'ANO' : 'NE';

                // Pomocná proměnná pro zjištění, jestli máme dva řádky dat
                const hasSecondRow = count2 > 0 && diam2 !== '';

                // Vykreslení Labelu, Laku, Alu a Výměny (ty jsou pro díl společné)
                doc.text(`${part.label}`, startX, currentY);
                doc.text(
                    `${lak}`,
                    startX + col.label + col.count + col.diam,
                    currentY
                );
                doc.text(
                    `${alu}`,
                    startX + col.label + col.count + col.diam + col.lak,
                    currentY
                );
                doc.text(
                    `${vym}`,
                    startX +
                        col.label +
                        col.count +
                        col.diam +
                        col.lak +
                        col.alu,
                    currentY
                );

                // Vykreslení prvního řádku KS a PRŮMĚR
                doc.text(`${count1}`, startX + col.label, currentY);
                doc.text(
                    `${diam1} mm`,
                    startX + col.label + col.count,
                    currentY
                );

                if (hasSecondRow) {
                    // Posuneme se o kousek níž pro druhý řádek v rámci téhož dílu
                    currentY += 4.5;

                    // Vykreslení druhého řádku KS a PRŮMĚR
                    doc.text(`${count2}`, startX + col.label, currentY);
                    doc.text(
                        `${diam2} mm`,
                        startX + col.label + col.count,
                        currentY
                    );

                    // Přidáme malý posun, aby border nebyl nalepený na textu
                    currentY += 1;
                }

                // Čára pod celým blokem dílu
                currentY += 1.5;
                doc.setLineWidth(0.1);
                doc.line(
                    startX,
                    currentY,
                    startX +
                        col.label +
                        col.count +
                        col.diam +
                        col.lak +
                        col.alu +
                        col.vym,
                    currentY
                );

                // Posun na další díl (pokud byl dvouřádkový, posuneme o něco méně, už jsme klesli)
                currentY += hasSecondRow ? 5.5 : 6.5;
            });

            const pdfBlob = doc.output('blob');
            const zip = new JSZip();
            zip.file(`${filename}.pdf`, pdfBlob);

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
                ...ADDITIONAL_DAMAGES.map((d) => d.id),
            ];

            for (const field of photoFields) {
                if (formData[field]) {
                    for (let i = 0; i < formData[field].length; i++) {
                        const img = formData[field][i];
                        if (img instanceof File) {
                            zip.file(`${field}_${i + 1}.jpg`, img);
                        }
                    }
                }
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' });

            // 3. ROZHODNUTÍ PODLE METODY ODESLÁNÍ
            if (formData.submissionMethod === 'download') {
                saveAs(zipBlob, `${filename}.zip`);
                alert('Soubor ZIP byl stažen do vašeho zařízení.');
            } else {
                try {
                    const emailFormData = new FormData();
                    emailFormData.append('file', zipBlob, `${filename}.zip`);
                    emailFormData.append('spz', formData.vehicleSPZ);
                    emailFormData.append('customer', formData.customerName);
                    emailFormData.append(
                        'technicianEmail',
                        'wp.zykl@gmail.com'
                    );
                    emailFormData.append(
                        'ccEmail',
                        formData.additionalEmail || ''
                    );

                    const res = await fetch('/api/send-order', {
                        method: 'POST',
                        body: emailFormData,
                    });

                    if (!res.ok) throw new Error('Chyba při odesílání.');
                    alert('Zakázka byla úspěšně odeslána e-mailem.');
                } catch (err) {
                    alert(
                        'E-mail se nepodařilo odeslat. Zkuste soubor stáhnout ručně.'
                    );
                    setLoading(false);
                    return;
                }
            }

            // 4. FINÁLNÍ UKONČENÍ
            const finalSPZ = formData.vehicleSPZ?.trim();
            if (finalSPZ) await finalizeOrder(finalSPZ, formData);

            setLoading(false);
            setTimeout(() => {
                setFormData(createInitialState());
                setStep(1);
                setSignatureImage(null);
                router.push('/splitter');
            }, 1000);
        };
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
                                    {userConfig.showExtraContact && (
                                        <>
                                            <FormInput
                                                label="Jméno technika"
                                                name="technicianName"
                                                value={
                                                    formData.technicianName ||
                                                    ''
                                                }
                                                onChange={handleChange}
                                            />
                                            <FormInput
                                                label="Telefon technika"
                                                name="technicianPhone"
                                                value={
                                                    formData.technicianPhone ||
                                                    ''
                                                }
                                                onChange={handleChange}
                                            />
                                            <FormInput
                                                label="Email technika"
                                                name="technicianMail"
                                                value={
                                                    formData.technicianMail ||
                                                    ''
                                                }
                                                onChange={handleChange}
                                            />
                                        </>
                                    )}
                                    <FormInput
                                        label="SPZ"
                                        name="vehicleSPZ"
                                        value={formData.vehicleSPZ}
                                        onChange={handleChange}
                                        required
                                    />
                                    {!userConfig.hiddenFields.includes(
                                        'vehicleBrand'
                                    ) && (
                                        <FormInput
                                            label="Značka vozidla"
                                            name="vehicleBrand"
                                            type="select"
                                            options={VEHICLE_BRANDS}
                                            value={formData.vehicleBrand}
                                            onChange={handleChange}
                                            //required
                                            disabled={!isSpzReady}
                                            placeholder="Vyberte..."
                                        />
                                    )}
                                    {!userConfig.hiddenFields.includes(
                                        'vehicleType'
                                    ) && (
                                        <FormInput
                                            label="Model (Druh)"
                                            name="vehicleType"
                                            value={formData.vehicleType}
                                            onChange={handleChange}
                                            //required
                                            disabled={!isSpzReady}
                                        />
                                    )}
                                    {!userConfig.hiddenFields.includes(
                                        'vehicleVIN'
                                    ) && (
                                        <FormInput
                                            label="VIN"
                                            name="vehicleVIN"
                                            value={formData.vehicleVIN}
                                            onChange={handleChange}
                                            //required
                                            disabled={!isSpzReady}
                                        />
                                    )}
                                    {!userConfig.hiddenFields.includes(
                                        'vehicleColor'
                                    ) && (
                                        <FormInput
                                            label="Barva"
                                            name="vehicleColor"
                                            value={formData.vehicleColor}
                                            onChange={handleChange}
                                            //required
                                            disabled={!isSpzReady}
                                        />
                                    )}
                                    {!userConfig.hiddenFields.includes(
                                        'vehicleYear'
                                    ) && (
                                        <FormInput
                                            label="Rok výroby"
                                            name="vehicleYear"
                                            value={formData.vehicleYear}
                                            onChange={handleChange}
                                            //required
                                            disabled={!isSpzReady}
                                        />
                                    )}
                                    {!userConfig.hiddenFields.includes(
                                        'vehicleDistance'
                                    ) && (
                                        <FormInput
                                            label="Stav tachometru (km)"
                                            name="vehicleDistance"
                                            type="number"
                                            value={formData.vehicleDistance}
                                            onChange={handleChange}
                                            //required
                                            disabled={!isSpzReady}
                                        />
                                    )}
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
                                        //required
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
                                        //required
                                        disabled={!isSpzReady}
                                        fullWidth={true}
                                    />
                                    <FormInput
                                        label="Pojišťovna"
                                        name="insuranceCompany"
                                        type="select"
                                        options={userConfig.insurers}
                                        value={formData.insuranceCompany}
                                        onChange={handleChange}
                                        //required
                                        disabled={!isSpzReady}
                                        placeholder="Vyberte..."
                                    />
                                    <FormInput
                                        label="Číslo pojistné události"
                                        name="insuranceNumber"
                                        value={formData.insuranceNumber}
                                        onChange={handleChange}
                                        //required
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
                            {Object.keys(FIELD_LABELS)
                                .filter((field) => {
                                    if (
                                        !userConfig.hiddenFields.length &&
                                        userConfig.requiredPhotos.lenth > 10
                                    )
                                        return true; // Pokud není žádné pole skryté a máme hodně povinných fotek, zobrazíme všechny
                                    return userConfig.requiredPhotos.includes(
                                        field
                                    );
                                })
                                .map((field) => {
                                    const photos = formData[field] || [];
                                    // Filtrujeme jen ty, co jsou soubory
                                    const filledPhotos = photos.filter(
                                        (img) => img instanceof File
                                    );
                                    const hasNoImage =
                                        filledPhotos.length === 0;
                                    // Zobrazíme buď všechny nahrané + 1 volný slot, nebo max 3
                                    const visibleCount = Math.min(
                                        filledPhotos.length + 1,
                                        3
                                    );
                                    const isRequired =
                                        userConfig.requiredPhotos.includes(
                                            field
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
                                                {hasNoImage && isRequired && (
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
                    <div className="space-y-8">
                        <img
                            src="/auto_details.svg"
                            alt="Auto detaily"
                            className="w-full max-w-sm mx-auto mb-8"
                        />

                        {/* 1. STANDARDNÍ DÍLY - Tady byla chyba, chyběl return a správné uzavření */}
                        {CAR_PARTS.map((part) => {
                            // Logika pro zjištění pořadí (kvůli badgům)
                            const activePartsSorted = [
                                ...CAR_PARTS,
                                ...ADDITIONAL_DAMAGES,
                            ]
                                .map((p) => ({
                                    id: p.id,
                                    price: realPartPrices[p.id] || 0,
                                }))
                                .filter((p) => p.price > 0)
                                .sort((a, b) => b.price - a.price);

                            const orderIndex = activePartsSorted.findIndex(
                                (p) => p.id === part.id
                            );

                            // Tady MUSÍ být return, aby se komponenta vykreslila
                            return (
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
                                    realPrice={realPartPrices[part.id] || 0}
                                    damageOrder={orderIndex}
                                    isGlobalMode={userConfig.isGlobal === true}
                                />
                            );
                        })}

                        {/* 2. SEKCE DALŠÍ SPECIFICKÁ POŠKOZENÍ */}
                        <div className="mt-10 pt-10 border-t-4 border-slate-100">
                            <h3 className="text-xl font-black text-slate-400 uppercase mb-6 text-center">
                                Další specifická poškození
                            </h3>

                            {ADDITIONAL_DAMAGES.map((part, index) => {
                                const isVisible =
                                    index === 0 ||
                                    parseInt(
                                        formData[
                                            `${
                                                ADDITIONAL_DAMAGES[index - 1].id
                                            }Count`
                                        ]
                                    ) > 0;

                                if (!isVisible) return null;

                                // I u doplňkových poškození musíme spočítat orderIndex pro badge
                                const activePartsSorted = [
                                    ...CAR_PARTS,
                                    ...ADDITIONAL_DAMAGES,
                                ]
                                    .map((p) => ({
                                        id: p.id,
                                        price: realPartPrices[p.id] || 0,
                                    }))
                                    .filter((p) => p.price > 0)
                                    .sort((a, b) => b.price - a.price);

                                const orderIndex = activePartsSorted.findIndex(
                                    (p) => p.id === part.id
                                );

                                return (
                                    <div
                                        key={part.id}
                                        className="animate-in fade-in slide-in-from-top-2 duration-300"
                                    >
                                        <FormPart
                                            id={part.id}
                                            label={part.label}
                                            category={part.category}
                                            formData={formData}
                                            onImageChange={handleImageChange}
                                            onChange={handleChange}
                                            onCheckboxChange={
                                                handleCheckboxChange
                                            }
                                            onRemoveImage={removeImage}
                                            realPrice={
                                                realPartPrices[part.id] || 0
                                            }
                                            damageOrder={orderIndex}
                                            isGlobalMode={isGlobalMode}
                                        />
                                    </div>
                                );
                            })}
                        </div>

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
                        <div className="mt-8 p-6 bg-slate-50 rounded-xl border-2 border-slate-200">
                            <h3 className="text-lg font-bold text-gray-700 mb-4 uppercase tracking-tight text-center">
                                Jak chcete zakázku dokončit?
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            submissionMethod: 'download',
                                        }))
                                    }
                                    className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                                        formData.submissionMethod === 'download'
                                            ? 'border-maingreen bg-green-50'
                                            : 'border-gray-200 bg-white opacity-60'
                                    }`}
                                >
                                    <span className="text-2xl">
                                        <NextImage
                                            src="/download.svg"
                                            alt="Email"
                                            width={32}
                                            height={32}
                                        />
                                    </span>
                                    <span className="font-bold text-sm uppercase">
                                        Stáhnout do mobilu
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            submissionMethod: 'email',
                                        }))
                                    }
                                    className={`p-4 rounded-lg border-2 flex flex-col justify-center items-center gap-2 transition-all ${
                                        formData.submissionMethod === 'email'
                                            ? 'border-maingreen bg-green-50'
                                            : 'border-gray-200 bg-white opacity-60'
                                    }`}
                                >
                                    <span className="text-2xl">
                                        <NextImage
                                            src="/email.svg"
                                            alt="Email"
                                            width={32}
                                            height={32}
                                        />
                                    </span>
                                    <span className="font-bold text-sm uppercase">
                                        Odeslat na e-mail
                                    </span>
                                </button>
                            </div>

                            {/*{formData.submissionMethod === 'email' && (
                                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                                    <FormInput
                                        label="Poslat kopii na (volitelné):"
                                        name="additionalEmail"
                                        type="email"
                                        placeholder="např. servis@firma.cz"
                                        value={formData.additionalEmail}
                                        onChange={handleChange}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1 italic">
                                        * ZIP bude odeslán na adresu technika a
                                        případně na tento e-mail.
                                    </p>
                                </div>
                            )} */}
                        </div>
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
                        /*disabled={
                            loading ||
                            (step === 1 && !isStep1Valid()) ||
                            (step === 2 && !isStep2Valid()) ||
                            (step === 3 && !isStep3Valid())
                        }*/
                        className={
                            `btn flex-1 font-bold text-white rounded bg-[#168E33] hover:bg-[#12752a] ` /*${
                            loading ||
                            (step === 2 && !isStep2Valid()) ||
                            (step === 1 && !isStep1Valid()) ||
                            (step === 3 && !isStep3Valid())
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-[#168E33] hover:bg-[#12752a]'
                        }`*/
                        }
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
