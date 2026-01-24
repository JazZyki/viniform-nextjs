"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Popup from "reactjs-popup";
import SignatureCanvas from 'react-signature-canvas';

import { CAR_PARTS, VEHICLE_BRANDS } from "./config";
import FormPart from "./FormParts";

export default function FormPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const signatureRef = useRef(null);
    const [signatureImage, setSignatureImage] = useState(null);

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
        doc.setFont("courier", "bold");
        
        const backgroundImage = new Image();
        backgroundImage.src = '/zakazkovy_list.jpg'; 
        
        backgroundImage.onload = async () => {
            doc.addImage(backgroundImage, 'PNG', 0, 0, 210, 297);
            
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
                        zip.file(`${field}_${i+1}.jpg`, opt);
                    }
                }
            }

            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, `${filename}.zip`);
            setLoading(false);
            alert("Hotovo!");
        };
    };

    return (
        <div className="max-w-4xl mx-auto p-4 bg-white min-h-screen">
            <div className="flex justify-between mb-8">
                {[1, 2, 3].map(s => (
                    <div key={s} className={`flex-1 text-center py-2 border-b-4 ${step === s ? 'border-blue-600 font-bold' : 'border-gray-200'}`}>
                        {s === 1 ? 'Údaje' : s === 2 ? 'Foto' : 'Díly'}
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="pb-24">
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-lg border">
                            <h2 className="text-lg font-bold mb-4 text-blue-900 uppercase tracking-wide border-b pb-2">Vozidlo a Technik</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="flex flex-col text-sm font-semibold">Technik (přihlášen)
                                    <input type="text" name="technician" value={formData.technician} readOnly className="bg-gray-200 p-2 rounded cursor-not-allowed" />
                                </label>
                                <label className="flex flex-col text-sm font-semibold">Značka vozidla *
                                    <select name="vehicleBrand" value={formData.vehicleBrand} onChange={handleChange} required className="p-2 border rounded">
                                        <option value="">Vyberte značku</option>
                                        {VEHICLE_BRANDS.map(brand => <option key={brand} value={brand}>{brand}</option>)}
                                    </select>
                                </label>
                                <label className="flex flex-col text-sm font-semibold">Model (Druh) *
                                    <input type="text" name="vehicleType" value={formData.vehicleType} onChange={handleChange} required className="p-2 border rounded" placeholder="např. Octavia" />
                                </label>
                                <label className="flex flex-col text-sm font-semibold">SPZ *
                                    <input type="text" name="vehicleSPZ" value={formData.vehicleSPZ} onChange={handleChange} required className="p-2 border rounded" />
                                </label>
                                <label className="flex flex-col text-sm font-semibold">VIN *
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
                            <h2 className="text-lg font-bold mb-4 text-blue-900 uppercase tracking-wide border-b pb-2">Zákazník a Pojišťovna</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label className="flex flex-col text-sm font-semibold">Jméno zákazníka *
                                    <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} required className="p-2 border rounded" />
                                </label>
                                <label className="flex flex-col text-sm font-semibold">Telefon
                                    <input type="tel" name="customerPhone" value={formData.customerPhone} onChange={handleChange} className="p-2 border rounded" />
                                </label>
                                <label className="col-span-full flex flex-col text-sm font-semibold">Adresa
                                    <input type="text" name="customerAddress" value={formData.customerAddress} onChange={handleChange} className="p-2 border rounded" />
                                </label>
                                <label className="flex flex-col text-sm font-semibold">Pojišťovna *
                                    <input type="text" name="insuranceCompany" value={formData.insuranceCompany} onChange={handleChange} required className="p-2 border rounded" />
                                </label>
                                <label className="flex flex-col text-sm font-semibold">Číslo pojistné události (ČPU) *
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
                            {['zapisOPoskozeni', 'pohledZePredu', 'pohledZePreduZleva', 'pohledZleva', 'pohledZezaduZleva', 'pohledZezadu', 'pohledZezaduZprava', 'pohledZprava', 'pohledZepreduZprava', 'STK', 'VIN', 'tachometr', 'interier'].map(field => (
                                <div key={field} className="border p-4 rounded-md border-secondarygreen bg-gray-50 shadow-sm">
                                    <p className="font-bold text-sm mb-3 uppercase text-maingreen">{field.replace(/([A-Z])/g, ' $1')}</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {formData[field].map((_, i) => (
                                            <input key={i} type="file" capture="camera" className="text-xs w-full" onChange={(e) => handleImageChange(field, i, e.target.files[0])} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4">
                        <img src="/auto_details.svg" alt="Auto detaily" className="w-full max-w-sm mx-auto mb-8" />
                        {CAR_PARTS.map(part => (
                            <FormPart key={part.id} id={part.id} label={part.label} formData={formData}
                                onImageChange={handleImageChange} onChange={handleChange} onCheckboxChange={handleCheckboxChange}
                            />
                        ))}

                        <div className="mt-8 border-t pt-6 bg-slate-50 p-4 rounded-xl">
                            <h3 className="font-bold mb-4">Podpis zákazníka</h3>
                            <Popup modal trigger={<button type="button" className="w-full p-4 bg-green-600 text-white rounded-lg font-bold">Otevřít podpis</button>} closeOnDocumentClick={false}>
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
                    </div>
                )}

                {/* Fixní lišta s navigací */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex justify-between gap-4 max-w-4xl mx-auto shadow-[0_-5px_15px_rgba(0,0,0,0.1)]">
                    {step > 1 && (
                        <button type="button" onClick={() => setStep(s => s - 1)} className="flex-1 p-3 bg-gray-200 rounded font-bold">Zpět</button>
                    )}
                    <button type="submit" disabled={loading} className={`flex-1 p-3 text-white rounded font-bold ${loading ? 'bg-gray-400' : 'bg-blue-600'}`}>
                        {loading ? 'Generuji...' : (step < 3 ? 'Další krok' : 'Dokončit a stáhnout')}
                    </button>
                </div>
            </form>
        </div>
    );
}
