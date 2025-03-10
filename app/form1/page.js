"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
//import Image from "next/image";

export default function FormPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        technician: '',
        vehicleBrand: '',
        vehicleType: '',
        vehicleSPZ: '',
        vehicleVIN: '',
        vehicleColor: '',
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
        globalPhotographyNotess: '',
        field1Images: Array(3).fill(""),
        field2Images: Array(3).fill(""),
        field3Images: Array(3).fill(""),
        field4Images: Array(3).fill(""),
        field5Images: Array(3).fill(""),
        field6Images: Array(3).fill(""),
        field7Images: Array(3).fill(""),
        field8Images: Array(3).fill(""),
        field9Images: Array(3).fill(""),
        field10Images: Array(3).fill(""),
        field11Images: Array(3).fill(""),
        field12Images: Array(3).fill(""),
        field13Images: Array(3).fill(""),
        field14Images: Array(3).fill(""),
        field15Images: Array(3).fill(""),
        field16Images: Array(3).fill(""),
        field17Images: Array(3).fill(""),
        field18Images: Array(3).fill(""),
        field19Images: Array(3).fill(""),
        field20Images: Array(3).fill(""),
        field21Images: Array(3).fill(""),
        field22Images: Array(3).fill(""),
        field23Images: Array(3).fill(""),
        field24Images: Array(3).fill(""),
        field25Images: Array(3).fill(""),
        field26Images: Array(3).fill(""),
        field27Images: Array(3).fill(""),
        field28Images: Array(3).fill(""),
    });
    const router = useRouter();
    const filename = `${formData.vehicleSPZ}_${formData.customerName}`;

    useEffect(() => {
        // Check login and fetch technician name
        const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        const technicianName = localStorage.getItem("username") || "";

        if (!isLoggedIn) {
            router.push("/login");
        } else {
            setFormData((prev) => ({
                ...prev,
                technician: technicianName,
            }));
        }
    }, [router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleImageChange = (field, index, file) => {
        const updatedImages = [...formData[field]];
        updatedImages[index] = file;
        setFormData({
            ...formData,
            [field]: updatedImages,
        });
    };

    const nextStep = () => setStep((prev) => prev + 1);
    const prevStep = () => setStep((prev) => prev - 1);

    const resizeAndCompressImage = (file, maxWidth, maxHeight, maxSizeKB) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const reader = new FileReader();

            reader.onload = (e) => {
                img.src = e.target.result;
            };

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob.size / 1024 > maxSizeKB) {
                        reject(new Error('Image size exceeds the maximum limit'));
                    } else {
                        resolve(blob);
                    }
                }, 'image/jpeg', 0.6); // Adjust the quality parameter as needed
            };

            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    };
    const uploadToDrive = async (zipBlob) => {
        const folderID = '1NDhnG2QhgFEb0eUUJFwsaanWFhz3FOVQ'
        const metadata = {
            name: `${filename}.zip`,
            mimeType: 'application/zip',
            parents: [folderID], // Specify the folder ID here
        };
        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append("file", zipBlob, `${filename}.zip`);
    
        const response = await fetch("/api/upload", {
            method: "POST",
            //headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }), // Ensure you have the correct access token
            body: formData,
        });
    
        const data = await response.json();
        if (data.success) {
            console.log("File uploaded successfully:", data.fileId);
            alert("Soubor byl úspěšně nahrán na Google Disk!");
        } else {
            console.error("Upload failed:", data.error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (step < 3) {
            console.log(step);
            nextStep();
        } else {
            console.log(step);

            // Create PDF
            const doc = new jsPDF();
            doc.setFont("courier", "bold");
            doc.setLanguage("cs");
            doc.setFontSize(13);
            doc.setTextColor(0, 0, 0);

            // Add background image
            const backgroundImage = new Image();
            backgroundImage.src = '/zakazkovy_list.jpg'; // Update with the correct path to your image
            backgroundImage.onload = () => {
                doc.addImage(backgroundImage, 'PNG', 0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight());

                // Define positions for each text field
                const positions = {
                    technician: { x: 147, y: 215 },
                    vehicleBrand: { x: 14, y: 65 },
                    vehicleType: { x: 65, y: 65 },
                    vehicleSPZ: { x: 122, y: 65 },
                    vehicleVIN: { x: 34, y: 117 },
                    vehicleColor: { x: 166, y: 108 },
                    vehicleDistance: { x: 107, y: 108 },
                    insuranceCompany: { x: 14, y: 80 },
                    insuranceNumber: { x: 56, y: 80 },
                    customerName: { x: 14, y: 51 },
                    customerAddress: { x: 10, y: 120 },
                    customerPhone: { x: 122, y: 51 },
                    serviceDate: { x: 10, y: 140 },
                    hailsDiameter: { x: 10, y: 150 },
                    contractMD: { x: 10, y: 160 },
                    contractPaint: { x: 10, y: 170 },
                    detailNotes: { x: 14, y: 231 },
                };

                // Add text fields to the PDF
                Object.keys(positions).forEach((key) => {
                    doc.text(`${formData[key]}`, positions[key].x, positions[key].y);
                });

                const pdfBlob = doc.output("blob");
                const textContent = Object.keys(formData)
                    .map(key => `${key}: ${formData[key]}`)
                    .join('\n');
                const textBlob = new Blob([textContent], { type: 'text/plain' });

                // Create ZIP file
                const zip = new JSZip();
                zip.file(`${filename}.pdf`, pdfBlob);
                zip.file(`${filename}.txt`, textBlob);

                const addImagesToZip = async () => {
                    for (let i = 0; i < formData.field1Images.length; i++) {
                        const image = formData.field1Images[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field1_image_${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.field2Images.length; i++) {
                        const image = formData.field2Images[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field2_image_${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                };

                addImagesToZip().then(() => {
                    zip.generateAsync({ type: "blob" }).then(async (zipBlob) => {
                        saveAs(zipBlob, `${filename}.zip`);
                        await uploadToDrive(zipBlob);
                    });

                    console.log("Form Data Submitted:", formData);
                    alert("Form submitted!");
                });
            };
        }
    };

    
    return (
        <form onSubmit={handleSubmit}>
            <div className="stepper">
                <div className={`step ${step === 1 ? 'active' : ''}`}>
                    <div className="step-icon">
                        <p>1</p>
                    </div>
                    <div className="step-text">
                        <p>Základní údaje</p>
                    </div>
                </div>
                <div className={`step ${step === 2 ? 'active' : ''}`}>
                    <div className="step-icon">
                        <p>2</p>
                    </div>
                    <div className="step-text">
                        <p>Foto globální</p>
                    </div>
                </div>
                <div className={`step ${step === 3 ? 'active' : ''}`}>
                    <div className="step-icon">
                        <p>3</p>
                    </div>
                    <div className="step-text">
                        <p>Foto detaily</p>
                    </div>
                </div>
            </div>

            {step === 1 && (
                <>
                    <div className="form-field">
                        <p className="form-field__label">Technik</p>
                        <label className="form-field__input flex flex-col disabled">Uživatelské jméno
                            <input
                                type="text"
                                name="technician"
                                value={formData.technician || ""}
                                readOnly
                                disabled
                            />
                        </label>
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">Údaje o vozidle</p>
                        <label className="form-field__input flex flex-row flex-wrap">Značka vozidla <span className="required">*</span>
                            <select
                                name="vehicleBrand"
                                value={formData.vehicleBrand || ""}
                                onChange={handleChange}
                                required
                            >
                                <option value="" disabled>
                                    Vyberte značku
                                </option>
                                <option value="Alfa Romeo">Alfa Romeo</option>
                                <option value="Audi">Audi</option>
                                <option value="BMW">BMW</option>
                                <option value="Citroën">Citroën</option>
                                <option value="Dacia">Dacia</option>
                                <option value="Fiat">Fiat</option>
                                <option value="Ford">Ford</option>
                                <option value="Honda">Honda</option>
                                <option value="Hyundai">Hyundai</option>
                                <option value="KIA">KIA</option>
                                <option value="Mazda">Mazda</option>
                                <option value="Mercedes-Benz">Mercedes-Benz</option>
                                <option value="Mitsubishi">Mitsubishi</option>
                                <option value="Nissan">Nissan</option>
                                <option value="Opel">Opel</option>
                                <option value="Peugeot">Peugeot</option>
                                <option value="Renault">Renault</option>
                                <option value="Seat">Seat</option>
                                <option value="Subaru">Subaru</option>
                                <option value="Suzuki">Suzuki</option>
                                <option value="Škoda">Škoda</option>
                                <option value="Toyota">Toyota</option>
                                <option value="Volkswagen">Volkswagen</option>
                                <option value="Volvo">Volvo</option>
                                <option value="Jiné - upřesním níže">Jiné - upřesním níže</option>
                            </select>
                        </label>

                        <label className="form-field__input flex flex-row flex-wrap">Druh vozidla <span className="required">*</span>
                            <input
                                type="text"
                                name="vehicleType"
                                placeholder="Octavia, Fabia, Kamiq, ..."
                                value={formData.vehicleType || ""}
                                onChange={handleChange}
                                required
                            />
                        </label>

                        <label className="form-field__input flex flex-row flex-wrap">SPZ vozidla<span className="required">*</span>
                            <input
                                type="text"
                                name="vehicleSPZ"
                                placeholder="XXX XX-XX"
                                value={formData.vehicleSPZ || ""}
                                onChange={handleChange}
                                required
                            />
                        </label>

                        <label className="form-field__input flex flex-row flex-wrap">VIN <span className="required">*</span>
                            <input
                                type="text"
                                name="vehicleVIN"
                                placeholder="17 znaků"
                                value={formData.vehicleVIN || ""}
                                onChange={handleChange}
                                required
                            />
                        </label>

                        <label className="form-field__input flex flex-row flex-wrap">Barva vozidla
                            <input
                                type="text"
                                name="vehicleColor"
                                placeholder="Černá, bílá, modrá, ..."
                                value={formData.vehicleColor || ""}
                                onChange={handleChange}
                            />
                        </label>

                        <label className="form-field__input flex flex-row flex-wrap">Stav tachometru <span className="required">*</span>
                            <input
                                type="text"
                                name="vehicleDistance"
                                placeholder="X XXX km"
                                value={formData.vehicleDistance || ""}
                                onChange={handleChange}
                                required
                            />
                        </label>

                        <label className="form-field__input flex flex-row flex-wrap">Pojišťovna <span className="required">*</span>
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
                                <option value="Ser. poj.">Servisní pojišťovna</option>
                                <option value="Slavia">Slavia</option>
                                <option value="VZP">VZP</option>
                                <option value="Ostatni">Ostatní</option>
                            </select>
                        </label>

                        <label className="form-field__input flex flex-row flex-wrap">Č.P.U. <span className="required">*</span>
                            <input
                                type="text"
                                name="insuranceNumber"
                                placeholder="XXXX"
                                value={formData.insuranceNumber || ""}
                                onChange={handleChange}
                                required
                            />
                        </label>
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">Majitel / provozovatel</p>
                        <label className="form-field__input flex flex-row flex-wrap">Jméno a příjmení <span className="required">*</span>
                            <input
                                type="text"
                                name="customerName"
                                placeholder="Josef Vomáčka"
                                value={formData.customerName || ""}
                                onChange={handleChange}
                                required
                            />
                        </label>

                        <label className="form-field__input flex flex-row flex-wrap">Adresa <span className="required">*</span>
                            <input
                                type="text"
                                name="customerAddress"
                                placeholder="Pod skalou 123, 123 45 Praha"
                                value={formData.customerAddress || ""}
                                onChange={handleChange}
                                required
                            />
                        </label>

                        <label className="form-field__input flex flex-row flex-wrap">Telefonní číslo <span className="required">*</span>
                            <div className="input-group">
                                <span className="input-group-text">+420</span>
                                <input
                                    type="tel"
                                    name="customerPhone"
                                    placeholder="777 777 777"
                                    value={formData.customerPhone || ""}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </label>
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">Zakázka - údaje</p>
                        <label className="form-field__input flex flex-row flex-wrap">Datum přijetí
                            <input
                                type="date"
                                name="serviceDate"
                                value={formData.serviceDate || ""}
                                onChange={handleChange}
                            />
                        </label>

                        <label className="form-field__input flex flex-row flex-wrap">&#8960; krupobití
                            <input
                                type="text"
                                name="hailsDiameter"
                                value={formData.hailsDiameter || ""}
                                onChange={handleChange}
                            />
                        </label>

                        <label className="form-field__input flex flex-row flex-wrap">M + D
                            <input
                                type="text"
                                name="contractMD"
                                placeholder=""
                                value={formData.contractMD || ""}
                                onChange={handleChange}
                            />
                        </label>

                        <label className="form-field__input flex flex-row flex-wrap">Poškození laku
                            <input
                                type="text"
                                name="contractPaint"
                                placeholder=""
                                value={formData.contractPaint || ""}
                                onChange={handleChange}
                            />
                        </label>
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">Poznámky</p>
                        <label className="form-field__input flex flex-col">
                            <textarea
                                name="detailNotes"
                                placeholder="Případné poznámky k fotografiím detailů"
                                value={formData.detailNotes || ""}
                                onChange={handleChange}
                            />
                        </label>
                    </div>
                </>
            )}

            {step === 2 && (
                <>
                    <img
                        src="/auto_global.svg"
                        alt="Zakazkovy list"
                        width={300}
                        height={300}
                        className="w-full mb-8"
                    />
                    <div className="form-field">
                        <p className="form-field__label">0 - Zápis o poškození</p>
                        {formData.field1Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field1Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field1Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">1 - Pohled zepředu</p>
                        {formData.field2Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field2Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field2Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">2 - Pohled zepředu zleva</p>
                        {formData.field3Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field3Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field3Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">3 - Pohled zleva</p>
                        {formData.field4Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field4Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field4Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">4 - Pohled zezadu zleva</p>
                        {formData.field5Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field5Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field5Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">5 - Pohled zezadu</p>
                        {formData.field6Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field6Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field6Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">6 - Pohled zezadu zprava</p>
                        {formData.field7Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field7Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field7Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">7 - Pohled zprava</p>
                        {formData.field8Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field8Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field8Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">8 - Pohled zepředu zprava</p>
                        {formData.field9Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field9Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field9Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">9 - STK</p>
                        {formData.field10Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field10Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field10Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">10 - VIN</p>
                        {formData.field11Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field11Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field11Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">11 - Stav tachometru</p>
                        {formData.field12Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field12Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field12Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">12 - Interiér</p>
                        {formData.field13Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field13Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field13Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">Poznámky k fotografiím globálního stavu</p>
                        <label className="form-field__input flex flex-col">
                            <textarea
                                name="globalPhotographyNotess"
                                placeholder="Případné poznámky..."
                                value={formData.globalPhotographyNotess || ""}
                                onChange={handleChange}
                            />
                        </label>
                    </div>
                </>
            )}

            {step === 3 && (
                <>
                    <img
                        src="/auto_details.svg"
                        alt="Zakazkovy list"
                        width={300}
                        height={300}
                        className="w-full mb-8"
                    />
                    <div className="form-field">
                        <p className="form-field__label">1 - Kapota</p>
                        {formData.field14Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field14Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field14Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">2 - Levý přední blatník</p>
                        {formData.field15Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field15Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field15Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">3 - Levé přední dveře</p>
                        {formData.field16Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field16Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field16Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">4 - Levé zadní dvěře</p>
                        {formData.field17Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field17Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field17Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">5 - Levý zadní blatník</p>
                        {formData.field18Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field18Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field18Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">6 - zadní kapota</p>
                        {formData.field19Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field19Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field19Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">7 - levý rám</p>
                        {formData.field20Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field20Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field20Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">8 - střecha</p>
                        {formData.field21Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field21Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field21Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">9 - pravý rám</p>
                        {formData.field22Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field22Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field22Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">10 - pravý zadní blatník</p>
                        {formData.field23Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field23Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field23Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">11 - Pravé zadní dvěře</p>
                        {formData.field24Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field24Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field24Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">12 - Pravé přední dvěře</p>
                        {formData.field25Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field25Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field25Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">13 - Pravý přední blatník</p>
                        {formData.field26Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field26Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field26Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">14 - Dodatečné foto 1</p>
                        {formData.field27Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field27Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field27Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">15 - Dodatečné foto 3</p>
                        {formData.field28Images.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('field28Images', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.field28Images[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                </>
            )}
            <div className="flex justify-end gap-4">
                {step > 1 && <button className="btn btn-secondary" type="button" onClick={prevStep}>Zpět</button>}
                <button className="btn btn-primary" type='submit' >{step < 3 ? 'Další' : 'Odeslat'}</button>
            </div>
        </form>
    );
}