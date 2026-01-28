"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Popup from "reactjs-popup";
import SignatureCanvas from 'react-signature-canvas';
import { robotoBase64 } from "../../lib/fonts/Roboto-Condensed-normal"
import { calculatePartPrice } from "../../lib/priceCalculator";
import { CAR_PARTS, VEHICLE_BRANDS } from "./config";
import FormPart from "./FormParts";

export default function FormPage({ initialTechnician }) {
    const FIELD_LABELS = {
        zapisOPoskozeni: "Zápis o poškození",
        pohledZePredu: "Pohled zepředu (1)",
        pohledZePreduZleva: "Pohled zepředu zleva (2)",
        pohledZleva: "Pohled zleva (3)",
        pohledZezaduZleva: "Pohled zezadu zleva (4)",
        pohledZezadu: "Pohled zezadu (5)",
        pohledZezaduZprava: "Pohled zezadu zprava (6)",
        pohledZprava: "Pohled zprava (7)",
        pohledZepreduZprava: "Pohled zepředu zprava (8)",
        STK: "STK",
        VIN: "VIN kód",
        tachometr: "Tachometr",
        interier: "Interiér"
    };
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const signatureRef = useRef(null);
    const [signatureImage, setSignatureImage] = useState(null);
    //const userTechnician = technician();

    // --- 1. KOMPLETNÍ INICIALIZACE STAVU ---
    const createInitialState = () => {
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
            serviceDate: '',
            hailsDiameter: '',
            contractMD: '',
            contractPaint: '',
            detailNotes: '',
            globalPhotographyNotes: '',
            globalPhotographyNotes2: '',

            // Krok 2: Globální fotky
            zapisOPoskozeni: Array(3).fill(""),
            pohledZePredu: Array(3).fill(""),
            pohledZePreduZleva: Array(3).fill(""),
            pohledZleva: Array(3).fill(""),
            pohledZezaduZleva: Array(3).fill(""),
            pohledZezadu: Array(3).fill(""),
            pohledZezaduZprava: Array(3).fill(""),
            pohledZprava: Array(3).fill(""),
            pohledZepreduZprava: Array(3).fill(""),
            STK: Array(3).fill(""),
            VIN: Array(3).fill(""),
            tachometr: Array(3).fill(""),
            interier: Array(3).fill(""),
            dodatecneFoto1: Array(10).fill(""),
            dodatecneFoto2: Array(10).fill(""),
        };

        // Krok 3: Dynamické díly
        CAR_PARTS.forEach(part => {
            state[part.id] = Array(10).fill("");
            state[`${part.id}Count`] = 0;
            state[`${part.id}Diameter`] = "";
            state[`${part.id}Lak`] = false;
            state[`${part.id}Vymena`] = false;
        });

        return state;
    };

    const [formData, setFormData] = useState(createInitialState());

    useEffect(() => {
        // Získání jména přihlášeného uživatele (Technika)
        const technicianName = localStorage.getItem("username") || "";
        setFormData(prev => ({ ...prev, technician: technicianName }));
    }, []);

    useEffect(() => {
        setFormData(prev => ({ ...prev, technician: initialTechnician }));
    }, [initialTechnician]);

    // Handlery
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleImageChange = (field, index, file) => {
        const updatedImages = [...formData[field]];
        updatedImages[index] = file;
        setFormData(prev => ({ ...prev, [field]: updatedImages }));
    };

    const logSignature = (close) => {
        if (signatureRef.current) {
            const canvas = signatureRef.current.getCanvas();
            const context = canvas.getContext("2d");
            const originalImage = context.getImageData(0, 0, canvas.width, canvas.height);
            context.globalCompositeOperation = "destination-over";
            context.fillStyle = "white";
            context.fillRect(0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/png");
            setSignatureImage(dataUrl);
            context.putImageData(originalImage, 0, 0);
            close();
        }
    };

    const getGrandTotal = () => {
        let baseSum = 0;
        CAR_PARTS.forEach(part => {
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
            total: Math.round(baseSum + fee)
        };
    };

    const pricing = getGrandTotal();

    // --- PDF / ZIP LOGIKA ---
    const resizeAndCompressImage = (file, maxWidth, maxHeight, maxSizeKB) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();
            reader.onload = (e) => { img.src = e.target.result; };
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                let width = img.width;
                let height = img.height;
                if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } }
                else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } }
                canvas.width = width; canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.6);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (step < 3) {
            setStep(s => s + 1);
            window.scrollTo(0, 0);
            return;
        }

        setLoading(true);
        const filename = `${formData.vehicleSPZ}_${formData.customerName}`;
        const doc = new jsPDF();
        doc.addFileToVFS("Roboto-Condensed.ttf", robotoBase64);
        doc.addFont("Roboto-Condensed.ttf", "RobotoCustom", "normal");

        const backgroundImage = new Image();
        backgroundImage.src = '/zakazkovy_list.jpg';
        const pricing = getGrandTotal();

        backgroundImage.onload = async () => {
            doc.addImage(backgroundImage, 'PNG', 0, 0, 210, 297);

            doc.setFont("RobotoCustom");
            doc.setFontSize(13); // Nastav velikost písma

            doc.text(`${pricing.total.toLocaleString()} Kč`, 14, 246);

            // Mapování textů do PDF (Dle tvých pozic)
            const txtPos = {
                technician: [133, 246], customerName: [14, 52], customerPhone: [122, 52],
                vehicleBrand: [14, 65], vehicleType: [65, 65], vehicleSPZ: [122, 65],
                vehicleVIN: [14, 80], vehicleDistance: [107, 80], vehicleYear: [136, 80], vehicleColor: [165, 80],
                insuranceCompany: [14, 93], insuranceNumber: [88, 93], serviceDate: [154, 93],
            };

            Object.entries(txtPos).forEach(([key, [x, y]]) => {
                if (formData[key]) doc.text(`${formData[key]}`, x, y);
            });

            // Dynamické vykreslení dílů z config.js
            CAR_PARTS.forEach(part => {
                const count = formData[`${part.id}Count`];
                const diam = formData[`${part.id}Diameter`];
                if (count > 0) doc.text(`${count}`, part.x, part.y);
                if (diam) doc.text(`${diam}`, part.x + 25, part.y);
                if (formData[`${part.id}Lak`]) doc.text("X", part.lakX, part.y);
                if (formData[`${part.id}Vymena`]) doc.text("X", part.vymenaX, part.y);
            });

            if (signatureImage) doc.addImage(signatureImage, 'PNG', 35, 266, 50, 20);

            // Poznámky (splitTextToSize pro zalomení řádků)
            if (formData.detailNotes) {
                const splitNotes = doc.splitTextToSize(formData.detailNotes, 60);
                doc.text(splitNotes, 134, 184);
            }

            const pdfBlob = doc.output("blob");
            const zip = new JSZip();
            zip.file(`${filename}.pdf`, pdfBlob);

            // Fotky do ZIPu
            const photoFields = ['zapisOPoskozeni', 'pohledZePredu', 'pohledZePreduZleva', 'STK', 'VIN', 'tachometr', 'interier', ...CAR_PARTS.map(p => p.id)];
            for (const field of photoFields) {
                for (let i = 0; i < formData[field].length; i++) {
                    const img = formData[field][i];
                    if (img instanceof File) {
                        const opt = await resizeAndCompressImage(img, 1600, 1600, 800);
                        zip.file(`${field}_${i + 1}.jpg`, opt);
                    }
                }
            }

            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, `${filename}.zip`);
            setLoading(false);
            alert("Hotovo!");
        };
    };

    const isStep2Valid = () => {
        // Seznam polí, která musí mít alespoň jednu fotku
        const requiredFields = [
            'zapisOPoskozeni', 'pohledZePredu', 'pohledZePreduZleva',
            'pohledZleva', 'pohledZezaduZleva', 'pohledZezadu',
            'pohledZezaduZprava', 'pohledZprava', 'pohledZepreduZprava',
            'STK', 'VIN', 'tachometr', 'interier'
        ];

        // Zkontrolujeme, zda každé pole má alespoň jeden prvek, který je File
        return requiredFields.every(field =>
            formData[field].some(img => img instanceof File)
        );
    };

    return (
        <div className="max-w-4xl mx-auto p-4 bg-white min-h-screen">
            <div className="flex justify-between mb-8">
                {[1, 2, 3].map(s => (
                    <div key={s} className={`flex-1 text-center py-2 border-b-4 ${step === s ? 'border-maingreen font-bold uppercase' : 'border-gray-200 uppercase'}`}>
                        {s === 1 ? 'Údaje' : s === 2 ? 'Foto' : 'Díly'}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="pb-24">
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <h2 className="text-lg font-bold mb-4 text-maingreen uppercase tracking-wide border-b pb-2">Vozidlo a Technik</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="flex flex-col text-sm font-semibold">Technik (přihlášen)
                                    <input type="text" name="technician" value={formData.technician} readOnly className="bg-gray-200 p-2 rounded cursor-not-allowed" />
                                </label>
                                <label className="flex flex-col text-sm font-semibold"><div>Značka vozidla <span className="text-red-600">*</span></div>
                                    <select name="vehicleBrand" value={formData.vehicleBrand} onChange={handleChange} required className="p-2 border rounded">
                                        <option value="">Vyberte značku</option>
                                        {VEHICLE_BRANDS.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                                    </select>
                                </label>
                                <label className="flex flex-col text-sm font-semibold"><div>Model (Druh) <span className="text-red-600">*</span></div>
                                    <input type="text" name="vehicleType" value={formData.vehicleType} onChange={handleChange} required className="p-2 border rounded" placeholder="např. Octavia" />
                                </label>
                                <label className="flex flex-col text-sm font-semibold"><div>SPZ <span className="text-red-600">*</span></div>
                                    <input type="text" name="vehicleSPZ" value={formData.vehicleSPZ} onChange={handleChange} required className="p-2 border rounded" />
                                </label>
                                <label className="flex flex-col text-sm font-semibold"><div>VIN <span className="text-red-600">*</span></div>
                                    <input type="text" name="vehicleVIN" value={formData.vehicleVIN} onChange={handleChange} required className="p-2 border rounded" />
                                </label>
                                <label className="flex flex-col text-sm font-semibold">Barva
                                    <input type="text" name="vehicleColor" value={formData.vehicleColor} onChange={handleChange} className="p-2 border rounded" />
                                </label>
                                <label className="flex flex-col text-sm font-semibold">Rok výroby
                                    <input type="text" name="vehicleYear" value={formData.vehicleYear} onChange={handleChange} className="p-2 border rounded" />
                                </label>
                                <label className="flex flex-col text-sm font-semibold">Stav tachometru (km)
                                    <input type="number" name="vehicleDistance" value={formData.vehicleDistance} onChange={handleChange} className="p-2 border rounded" />
                                </label>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <h2 className="text-lg font-bold mb-4 text-maingreen uppercase tracking-wide border-b pb-2">Zákazník a Pojišťovna</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="flex flex-col text-sm font-semibold"><div>Jméno zákazníka <span className="text-red-600">*</span></div>
                                    <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} required className="p-2 border rounded" />
                                </label>
                                <label className="flex flex-col text-sm font-semibold">Telefon
                                    <input type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleChange} className="p-2 border rounded" />
                                </label>
                                <label className="col-span-full flex flex-col text-sm font-semibold">Adresa
                                    <input type="text" name="customerAddress" value={formData.customerAddress} onChange={handleChange} className="p-2 border rounded" />
                                </label>
                                <label className="flex flex-col text-sm font-semibold"><div>Pojišťovna <span className="text-red-600">*</span></div>
                                    <select
                                        name="insuranceCompany"
                                        value={formData.insuranceCompany || ""}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="" disabled>
                                            Vyberte Pojišťovnu
                                        </option>
                                        <option value="Allianz">Allianz</option>
                                        <option value="AXA">AXA</option>
                                        <option value="CPP">ČPP</option>
                                        <option value="CSOB">ČSOB Pojišťovna</option>
                                        <option value="Direct">Direct</option>
                                        <option value="Generali">Generali</option>
                                        <option value="Kooperativa">Kooperativa</option>
                                        <option value="Pillow">Pillow</option>
                                        <option value="Servisní pojišťovna">Servisní pojišťovna</option>
                                        <option value="Slavia">Slavia</option>
                                        <option value="VZP">VZP</option>
                                        <option value="Ostatni">Ostatní</option>
                                    </select>
                                </label>
                                <label className="flex flex-col text-sm font-semibold"><div>ČPU <span className="text-red-600">*</span></div>
                                    <input type="text" name="insuranceNumber" value={formData.insuranceNumber} onChange={handleChange} required className="p-2 border rounded" />
                                </label>
                                <label className="flex flex-col text-sm font-semibold">Datum přijetí
                                    <input type="date" name="serviceDate" value={formData.serviceDate} onChange={handleChange} className="p-2 border rounded" />
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <img src="/auto_global.svg" alt="Auto" className="w-full max-w-sm mx-auto" />
                        <div className="space-y-4">
                            <div className="mb-6">
                                {!isStep2Valid() ? (
                                    <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-4 text-sm rounded shadow-sm">
                                        <p className="font-bold">Chybějící fotografie</p>
                                        <p>Pro pokračování musíte vložit alespoň jednu fotografii do každé kategorie.</p>
                                    </div>
                                ) : (
                                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 text-sm rounded shadow-sm">
                                        <p className="font-bold">Vše v pořádku</p>
                                        <p>Můžete pokračovat na detaily poškození.</p>
                                    </div>
                                )}
                            </div>

                            {Object.keys(FIELD_LABELS).map(field => { // Mapujeme přes klíče našeho slovníku                                const filledCount = formData[field].filter(img => img !== "").length;
                                const filledCount = formData[field].filter(img => img !== "").length;
                                const visibleCount = Math.min(filledCount + 1, 3); // Max 3 fotky

                                return (
                                    <div key={field} className="border p-4 rounded-md border-secondarygreen bg-gray-50 shadow-sm mb-4 text-left">
                                        <p className="font-bold text-md mb-3 uppercase text-maingreen">
                                            {FIELD_LABELS[field] || field}
                                        </p>
                                        <div className="space-y-2">
                                            {[...Array(visibleCount)].map((_, i) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <input
                                                        type="file"
                                                        capture="camera"
                                                        className="text-md w-full border p-2 rounded bg-white shadow-inner focus:ring-2 focus:ring-green-500"
                                                        onChange={(e) => handleImageChange(field, i, e.target.files[0])}
                                                    />
                                                    {formData[field][i] instanceof File && (
                                                        <span className="text-green-600 font-bold">OK</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <img src="/auto_details.svg" alt="Auto detaily" className="w-full max-w-sm mx-auto mb-8" />
                        {CAR_PARTS.map(part => (
                            <FormPart
                                key={part.id}
                                id={part.id}
                                label={part.label}
                                category={part.category}
                                formData={formData}
                                onImageChange={handleImageChange}
                                onChange={handleChange}
                                onCheckboxChange={handleCheckboxChange}
                            />
                        ))}

                        <div className="mt-8 border border-maingreen pt-6 bg-slate-50 p-4 rounded-xl">
                            <h3 className="font-bold mb-4">Podpis zákazníka</h3>
                            <Popup modal trigger={<button type="button" className="w-full btn btn-primary  font-bold">Otevřít podpis</button>} closeOnDocumentClick={false}>
                                {close => (
                                    <div className="bg-white p-4 rounded border">
                                        <SignatureCanvas ref={signatureRef} penColor='black' canvasProps={{ width: 400, height: 200, className: 'border w-full' }} />
                                        <div className="flex gap-4 mt-4">
                                            <button type="button" onClick={() => logSignature(close)} className="flex-1 p-2 bg-green-700 text-white rounded">Vložit</button>
                                            <button type="button" onClick={() => signatureRef.current.clear()} className="flex-1 p-2 bg-gray-200 rounded">Smazat</button>
                                        </div>
                                    </div>
                                )}
                            </Popup>
                            {signatureImage && <img src={signatureImage} alt="Podpis" className="mt-4 border h-20 mx-auto" />}
                        </div>
                        <div className="mt-10 p-6 bg-green-50 rounded-xl border-2 border-maingreen">
                            <h3 className="text-lg font-bold text-maingreen mb-2 uppercase tracking-tight">Souhrn kalkulace</h3>
                            <div className="space-y-1">
                                <div className="flex justify-between text-gray-600">
                                    <span>Základní oprava:</span>
                                    <span>{pricing.base.toLocaleString()} Kč</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Režijní materiál (2%):</span>
                                    <span>{pricing.fee.toLocaleString()} Kč</span>
                                </div>
                                <div className="flex justify-between text-xl font-black text-maingreen border-t pt-2 mt-2">
                                    <span>CELKEM BEZ DPH:</span>
                                    <span>{pricing.total.toLocaleString()} Kč</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Fixní lišta s navigací */}
                <div className="fixed max-w-md bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-between gap-4 max-w-4xl mx-auto shadow-lg z-50">
                    {step > 1 && (
                        <button
                            type="button"
                            onClick={() => setStep(s => s - 1)}
                            className="btn btn-secondary flex-1"
                        >
                            Zpět
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={loading || (step === 2 && !isStep2Valid())}
                        className={`btn flex-1 font-bold text-white rounded ${loading || (step === 2 && !isStep2Valid())
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-[#168E33] hover:bg-[#12752a]'
                            }`}
                    >
                        {loading ? 'Generuji...' : (step < 3 ? 'Další krok' : 'Dokončit')}
                    </button>
                </div>
            </form>
        </div>
    );
}
