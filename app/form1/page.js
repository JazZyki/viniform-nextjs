"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";

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
        /*insuranceCompany: '',
        insuranceNumber: '',
        customerName: '',
        customerAddress: '',
        customerPhone: '',
        serviceDate: '',
        hailsDiameter: '',
        contractMD: '',
        contractPaint: '',
        detailNotes: '',*/
        field1Images: Array(3).fill(""),
        field2Images: Array(3).fill(""),
    });
    const router = useRouter();

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
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleImageChange = (field, index, file) => {
        const updatedImages = [...formData[field]];
        updatedImages[index] = file;
        setFormData((prev) => ({ ...prev, [field]: updatedImages }));
    };

    const nextStep = () => setStep((prev) => prev + 1);
    const prevStep = () => setStep((prev) => prev - 1);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Create PDF
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        const backgroundImage = new Image();
        backgroundImage.src = 'https://me.jazzyki.cz/zakazkovy_list.jpg'; // Update with the correct path to your image
        backgroundImage.onload = async () => {
            doc.addImage(backgroundImage, 'PNG', 0, 0, 210, 297);

            const positions = {
                technician: { x: 147, y: 218 },
                vehicleBrand: { x: 14, y: 66 },
                vehicleType: { x: 65, y: 66 },
                vehicleSPZ: { x: 121, y: 66 },
                vehicleVIN: { x: 33, y: 117 },
                vehicleColor: { x: 166, y: 108 },
                vehicleDistance: { x: 107, y: 108 },
                insuranceCompany: { x: 14, y: 80 },
                insuranceNumber: { x: 55, y: 80 },
                /*customerName: { x: 14, y: 52 },
                customerAddress: { x: 10, y: 120 },
                customerPhone: { x: 10, y: 130 },
                serviceDate: { x: 10, y: 140 },
                hailsDiameter: { x: 10, y: 150 },
                contractMD: { x: 10, y: 160 },
                contractPaint: { x: 10, y: 170 },
                detailNotes: { x: 10, y: 180 },*/
            };
            Object.keys(positions).forEach((key) => {
                doc.text(`${key}: ${formData[key]}`, positions[key].x, positions[key].y);
            });

            const pdfBlob = doc.output("blob");

            // Create ZIP file
            const zip = new JSZip();
            zip.file("form_data.pdf", pdfBlob);

            // Add images to ZIP
            formData.field1Images.forEach((image, index) => {
                if (image) {
                    zip.file(`field1_image_${index + 1}.jpg`, image);
                }
            });
            formData.field2Images.forEach((image, index) => {
                if (image) {
                    zip.file(`field2_image_${index + 1}.jpg`, image);
                }
            });

            const zipBlob = await zip.generateAsync({ type: "blob" });
            saveAs(zipBlob, "form_data.zip");

            console.log("Form Data Submitted:", formData);
            alert("Form submitted!");
        };
    }

        return (
            <div>
                {step === 1 && (
                    <>
                        <div className="stepper">
                            <div className="step active">
                                <div className="step-icon">
                                    <p>1</p>
                                </div>
                                <div className="step-text">
                                    <p>Základní údaje</p>
                                </div>
                            </div>
                            <div className="step">
                                <div className="step-icon">
                                    <p>2</p>
                                </div>
                                <div className="step-text">
                                    <p>Foto globální</p>
                                </div>
                            </div>
                            <div className="step">
                                <div className="step-icon">
                                    <p>3</p>
                                </div>
                                <div className="step-text">
                                    <p>Foto detaily</p>
                                </div>
                            </div>
                        </div>
                        <form>
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
                                        <option value="ČPP">ČPP</option>
                                        <option value="ČSOB Pojišťovna">ČSOB Pojišťovna</option>
                                        <option value="Direct">Direct</option>
                                        <option value="Generali">Generali</option>
                                        <option value="Kooperativa">Kooperativa</option>
                                        <option value="Pillow">Pillow</option>
                                        <option value="Servisní pojišťovna">Servisní pojišťovna</option>
                                        <option value="Slavia">Slavia</option>
                                        <option value="VZP">VZP</option>
                                        <option value="Ostatní">Ostatní</option>
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

                            {/*<div className="form-field">
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
                            <p className="form-field__label">Poznámky k detailním fotografiím</p>
                            <label className="form-field__input flex flex-col">Poznámky
                                <textarea
                                    name="notes"
                                    placeholder="Případné poznámky k fotografiím detailů"
                                    value={formData.detailNotes || ""}
                                    onChange={handleChange}
                                />
                            </label>
                        </div>*/}
                            <div className="buttons">
                                <button type="button" className="btn btn-primary btn-next" onClick={nextStep}>
                                    Next
                                </button>

                            </div>
                        </form>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className="stepper">
                            <div className="step">
                                <div className="step-icon">
                                    <p>1</p>
                                </div>
                                <div className="step-text">
                                    <p>Základní údaje</p>
                                </div>
                            </div>
                            <div className="step active">
                                <div className="step-icon">
                                    <p>2</p>
                                </div>
                                <div className="step-text">
                                    <p>Foto globální</p>
                                </div>
                            </div>
                            <div className="step">
                                <div className="step-icon">
                                    <p>3</p>
                                </div>
                                <div className="step-text">
                                    <p>Foto detaily</p>
                                </div>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-field">
                                <p className="form-field__label">Zápis o poškození</p>
                                {formData.field1Images.map((image, index) => (
                                    <div key={index} className="form-field__input flex flex-row flex-wrap">
                                        <label>
                                            {index + 1}. Zápis o poškození
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
                                <p className="form-field__label">Zápis o poškození</p>
                                {formData.field2Images.map((image, index) => (
                                    <div key={index} className="form-field__input flex flex-row flex-wrap">
                                        <label>
                                            {index + 1}. Zápis o poškození
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
                            <button type="button" onClick={prevStep}>
                                Back
                            </button>
                            <button type="submit">Submit</button>
                        </form>
                    </>
                )}
            </div>
        );
    }