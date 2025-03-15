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
        kapota: Array(3).fill(""),
        levyPredniBlatnik: Array(3).fill(""),
        levePredniDvere: Array(3).fill(""),
        leveZadniDvere: Array(3).fill(""),
        leveZadniBlatniky: Array(3).fill(""),
        zadniKapota: Array(3).fill(""),
        levyRam: Array(3).fill(""),
        strecha: Array(3).fill(""),
        pravyRam: Array(3).fill(""),
        pravyZadniBlatnik: Array(3).fill(""),
        praveZadniDvere: Array(3).fill(""),
        pravePredniDvere: Array(3).fill(""),
        pravyPredniBlatnik: Array(3).fill(""),
        dodatecneFoto1: Array(3).fill(""),
        dodatecneFoto2: Array(3).fill(""),
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
        const formData = new FormData();
        formData.append("file", zipBlob, `${filename}.zip`);

        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        if (data.success) {
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
                    for (let i = 0; i < formData.zapisOPoskozeni.length; i++) {
                        const image = formData.zapisOPoskozeni[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`zapisOPoskozeni_${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.pohledZePredu.length; i++) {
                        const image = formData.pohledZePredu[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`pohledZePredu_${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.pohledZePreduZleva.length; i++) {
                        const image = formData.pohledZePreduZleva[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field3_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.pohledZleva.length; i++) {
                        const image = formData.pohledZleva[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field4_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.pohledZezaduZleva.length; i++) {
                        const image = formData.pohledZezaduZleva[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field5_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.pohledZezadu.length; i++) {
                        const image = formData.pohledZezadu[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field6_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.pohledZezaduZprava.length; i++) {
                        const image = formData.pohledZezaduZprava[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field7_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.pohledZprava.length; i++) {
                        const image = formData.pohledZprava[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field8_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.pohledZepreduZprava.length; i++) {
                        const image = formData.pohledZepreduZprava[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field9_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.STK.length; i++) {
                        const image = formData.STK[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field10_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.VIN.length; i++) {
                        const image = formData.VIN[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field11_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.tachometr.length; i++) {
                        const image = formData.tachometr[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field12_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.interier.length; i++) {
                        const image = formData.interier[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field13_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.kapota.length; i++) {
                        const image = formData.kapota[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field14_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.levyPredniBlatnik.length; i++) {
                        const image = formData.levyPredniBlatnik[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field15_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.levePredniDvere.length; i++) {
                        const image = formData.levePredniDvere[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field16_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.leveZadniDvere.length; i++) {
                        const image = formData.leveZadniDvere[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field17_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.leveZadniBlatniky.length; i++) {
                        const image = formData.leveZadniBlatniky[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field18_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.zadniKapota.length; i++) {
                        const image = formData.zadniKapota[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field19_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.levyRam.length; i++) {
                        const image = formData.levyRam[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field20_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.strecha.length; i++) {
                        const image = formData.strecha[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field21_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.pravyRam.length; i++) {
                        const image = formData.pravyRam[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field22_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.pravyZadniBlatnik.length; i++) {
                        const image = formData.pravyZadniBlatnik[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field23_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.praveZadniDvere.length; i++) {
                        const image = formData.praveZadniDvere[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field24_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.pravePredniDvere.length; i++) {
                        const image = formData.pravePredniDvere[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field25_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.pravyPredniBlatnik.length; i++) {
                        const image = formData.pravyPredniBlatnik[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field26_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.dodatecneFoto1.length; i++) {
                        const image = formData.dodatecneFoto1[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field27_image${i + 1}.jpg`, optimizedImage);
                            } catch (error) {
                                console.error('Error optimizing image:', error);
                            }
                        }
                    }
                    for (let i = 0; i < formData.dodatecneFoto2.length; i++) {
                        const image = formData.dodatecneFoto2[i];
                        if (image) {
                            try {
                                const optimizedImage = await resizeAndCompressImage(image, 1920, 1920, 1000);
                                zip.file(`field28_image${i + 1}.jpg`, optimizedImage);
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

                    alert("Formulář byl vyplněn a je připraven ke stažení!");
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

                        <label className="form-field__input flex flex-row flex-wrap">SPZ vozidla
                            <input
                                type="text"
                                name="vehicleSPZ"
                                placeholder="XXX XX-XX"
                                value={formData.vehicleSPZ || ""}
                                onChange={handleChange}
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

                        <label className="form-field__input flex flex-row flex-wrap">Stav tachometru
                            <input
                                type="text"
                                name="vehicleDistance"
                                placeholder="X XXX km"
                                value={formData.vehicleDistance || ""}
                                onChange={handleChange}
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

                        <label className="form-field__input flex flex-row flex-wrap">Adresa
                            <input
                                type="text"
                                name="customerAddress"
                                placeholder="Pod skalou 123, 123 45 Praha"
                                value={formData.customerAddress || ""}
                                onChange={handleChange}
                            />
                        </label>

                        <label className="form-field__input flex flex-row flex-wrap">Telefonní číslo
                            <div className="input-group">
                                <span className="input-group-text">+420</span>
                                <input
                                    type="tel"
                                    name="customerPhone"
                                    placeholder="777 777 777"
                                    value={formData.customerPhone || ""}
                                    onChange={handleChange}
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
                        {formData.zapisOPoskozeni.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('zapisOPoskozeni', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.zapisOPoskozeni[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">1 - Pohled zepředu</p>
                        {formData.pohledZePredu.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('pohledZePredu', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.pohledZePredu[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">2 - Pohled zepředu zleva</p>
                        {formData.pohledZePreduZleva.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('pohledZePreduZleva', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.pohledZePreduZleva[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">3 - Pohled zleva</p>
                        {formData.pohledZleva.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('pohledZleva', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.pohledZleva[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">4 - Pohled zezadu zleva</p>
                        {formData.pohledZezaduZleva.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('pohledZezaduZleva', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.pohledZezaduZleva[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">5 - Pohled zezadu</p>
                        {formData.pohledZezadu.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('pohledZezadu', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.pohledZezadu[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">6 - Pohled zezadu zprava</p>
                        {formData.pohledZezaduZprava.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('pohledZezaduZprava', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.pohledZezaduZprava[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">7 - Pohled zprava</p>
                        {formData.pohledZprava.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('pohledZprava', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.pohledZprava[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">8 - Pohled zepředu zprava</p>
                        {formData.pohledZepreduZprava.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('pohledZepreduZprava', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.pohledZepreduZprava[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">9 - STK</p>
                        {formData.STK.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('STK', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.STK[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">10 - VIN</p>
                        {formData.VIN.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('VIN', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.VIN[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">11 - Stav tachometru</p>
                        {formData.tachometr.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('tachometr', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.tachometr[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">12 - Interiér</p>
                        {formData.interier.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('interier', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.interier[index - 1]}
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
                        {formData.kapota.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('kapota', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.kapota[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                        <div className="flex flex-row flex-wrap w-full items-start detail-info">
                            <label className="form-field__input flex flex-row flex-wrap w-1/2 mt-0 pr-4">Počet poškození
                                <input
                                    type="number"
                                    name="kapotaCount"
                                    placeholder="1"
                                    value={formData.kapotaCount || ""}
                                    onChange={handleChange}
                                    min={1}
                                />
                            </label>
                            <label className="form-field__input flex flex-row flex-wrap w-1/2">Průměr
                                <select
                                    name="kapotaDiameter"
                                    value={formData.kapotaDiameter || ""}
                                    onChange={handleChange}
                                >
                                    <option value="" disabled>
                                        Vyberte průměr
                                    </option>
                                    <option value="20-30">20-30 mm</option>
                                    <option value="30-40">30-40 mm</option>
                                    <option value="40-50">40-50 mm</option>
                                    <option value="50-60">50-60 mm</option>
                                    <option value="60-70">60-70 mm</option>
                                    <option value="70-80">70-80 mm</option>
                                    <option value="80-90">80-90 mm</option>
                                    <option value="90-100">90-100 mm</option>
                                </select>
                            </label>
                            
                        </div>
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">2 - Levý přední blatník</p>
                        {formData.levyPredniBlatnik.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('levyPredniBlatnik', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.levyPredniBlatnik[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                        <div className="flex flex-row flex-wrap w-full items-start detail-info">
                            <label className="form-field__input flex flex-row flex-wrap w-1/2 mt-0 pr-4">Počet poškození
                                <input
                                    type="number"
                                    name="levyPredniBlatnikCount"
                                    placeholder="1"
                                    value={formData.levyPredniBlatnikCount || ""}
                                    onChange={handleChange}
                                    min={1}
                                />
                            </label>
                            <label className="form-field__input flex flex-row flex-wrap w-1/2">Průměr
                                <select
                                    name="levyPredniBlatnikDiameter"
                                    value={formData.levyPredniBlatnikDiameter || ""}
                                    onChange={handleChange}
                                >
                                    <option value="" disabled>
                                        Vyberte průměr
                                    </option>
                                    <option value="20-30">20-30 mm</option>
                                    <option value="30-40">30-40 mm</option>
                                    <option value="40-50">40-50 mm</option>
                                    <option value="50-60">50-60 mm</option>
                                    <option value="60-70">60-70 mm</option>
                                    <option value="70-80">70-80 mm</option>
                                    <option value="80-90">80-90 mm</option>
                                    <option value="90-100">90-100 mm</option>
                                </select>
                            </label>
                        </div>
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">3 - Levé přední dveře</p>
                        {formData.levePredniDvere.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('levePredniDvere', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.levePredniDvere[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                        <div className="flex flex-row flex-wrap w-full items-start detail-info">
                            <label className="form-field__input flex flex-row flex-wrap w-1/2 mt-0 pr-4">Počet poškození
                                <input
                                    type="number"
                                    name="levePredniDvereCount"
                                    placeholder="1"
                                    value={formData.levePredniDvereCount || ""}
                                    onChange={handleChange}
                                    min={1}
                                />
                            </label>
                            <label className="form-field__input flex flex-row flex-wrap w-1/2">Průměr
                                <select
                                    name="levePredniDvereDiameter"
                                    value={formData.levePredniDvereDiameter || ""}
                                    onChange={handleChange}
                                >
                                    <option value="" disabled>
                                        Vyberte průměr
                                    </option>
                                    <option value="20-30">20-30 mm</option>
                                    <option value="30-40">30-40 mm</option>
                                    <option value="40-50">40-50 mm</option>
                                    <option value="50-60">50-60 mm</option>
                                    <option value="60-70">60-70 mm</option>
                                    <option value="70-80">70-80 mm</option>
                                    <option value="80-90">80-90 mm</option>
                                    <option value="90-100">90-100 mm</option>
                                </select>
                            </label>
                        </div>
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">4 - Levé zadní dvěře</p>
                        {formData.leveZadniDvere.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('leveZadniDvere', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.leveZadniDvere[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                        <div className="flex flex-row flex-wrap w-full items-start detail-info">
                            <label className="form-field__input flex flex-row flex-wrap w-1/2 mt-0 pr-4">Počet poškození
                                <input
                                    type="number"
                                    name="leveZadniDvereCount"
                                    placeholder="1"
                                    value={formData.leveZadniDvereCount || ""}
                                    onChange={handleChange}
                                    min={1}
                                />
                            </label>
                            <label className="form-field__input flex flex-row flex-wrap w-1/2">Průměr
                                <select
                                    name="leveZadniDvereDiameter"
                                    value={formData.leveZadniDvereDiameter || ""}
                                    onChange={handleChange}
                                >
                                    <option value="" disabled>
                                        Vyberte průměr
                                    </option>
                                    <option value="20-30">20-30 mm</option>
                                    <option value="30-40">30-40 mm</option>
                                    <option value="40-50">40-50 mm</option>
                                    <option value="50-60">50-60 mm</option>
                                    <option value="60-70">60-70 mm</option>
                                    <option value="70-80">70-80 mm</option>
                                    <option value="80-90">80-90 mm</option>
                                    <option value="90-100">90-100 mm</option>
                                </select>
                            </label>
                        </div>
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">5 - Levý zadní blatník</p>
                        {formData.leveZadniBlatniky.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('leveZadniBlatniky', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.leveZadniBlatniky[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                        <div className="flex flex-row flex-wrap w-full items-start detail-info">
                            <label className="form-field__input flex flex-row flex-wrap w-1/2 mt-0 pr-4">Počet poškození
                                <input
                                    type="number"
                                    name="leveZadniBlatnikyCount"
                                    placeholder="1"
                                    value={formData.leveZadniBlatnikyCount || ""}
                                    onChange={handleChange}
                                    min={1}
                                />
                            </label>
                            <label className="form-field__input flex flex-row flex-wrap w-1/2">Průměr
                                <select
                                    name="leveZadniBlatnikyDiameter"
                                    value={formData.leveZadniBlatnikyDiameter || ""}
                                    onChange={handleChange}
                                >
                                    <option value="" disabled>
                                        Vyberte průměr
                                    </option>
                                    <option value="20-30">20-30 mm</option>
                                    <option value="30-40">30-40 mm</option>
                                    <option value="40-50">40-50 mm</option>
                                    <option value="50-60">50-60 mm</option>
                                    <option value="60-70">60-70 mm</option>
                                    <option value="70-80">70-80 mm</option>
                                    <option value="80-90">80-90 mm</option>
                                    <option value="90-100">90-100 mm</option>
                                </select>
                            </label>
                        </div>
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">6 - zadní kapota</p>
                        {formData.zadniKapota.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('zadniKapota', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.zadniKapota[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                        <div className="flex flex-row flex-wrap w-full items-start detail-info">
                            <label className="form-field__input flex flex-row flex-wrap w-1/2 mt-0 pr-4">Počet poškození
                                <input
                                    type="number"
                                    name="zadniKapotaCount"
                                    placeholder="1"
                                    value={formData.zadniKapotaCount || ""}
                                    onChange={handleChange}
                                    min={1}
                                />
                            </label>
                            <label className="form-field__input flex flex-row flex-wrap w-1/2">Průměr
                                <select
                                    name="kapotaDiameter"
                                    value={formData.zadniKapotaDiameter || ""}
                                    onChange={handleChange}
                                >
                                    <option value="" disabled>
                                        Vyberte průměr
                                    </option>
                                    <option value="20-30">20-30 mm</option>
                                    <option value="30-40">30-40 mm</option>
                                    <option value="40-50">40-50 mm</option>
                                    <option value="50-60">50-60 mm</option>
                                    <option value="60-70">60-70 mm</option>
                                    <option value="70-80">70-80 mm</option>
                                    <option value="80-90">80-90 mm</option>
                                    <option value="90-100">90-100 mm</option>
                                </select>
                            </label>
                        </div>
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">7 - levý rám</p>
                        {formData.levyRam.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('levyRam', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.levyRam[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                        <div className="flex flex-row flex-wrap w-full items-start detail-info">
                            <label className="form-field__input flex flex-row flex-wrap w-1/2 mt-0 pr-4">Počet poškození
                                <input
                                    type="number"
                                    name="levyRamCount"
                                    placeholder="1"
                                    value={formData.levyRamCount || ""}
                                    onChange={handleChange}
                                    min={1}
                                />
                            </label>
                            <label className="form-field__input flex flex-row flex-wrap w-1/2">Průměr
                                <select
                                    name="levyRamDiameter"
                                    value={formData.levyRamDiameter || ""}
                                    onChange={handleChange}
                                >
                                    <option value="" disabled>
                                        Vyberte průměr
                                    </option>
                                    <option value="20-30">20-30 mm</option>
                                    <option value="30-40">30-40 mm</option>
                                    <option value="40-50">40-50 mm</option>
                                    <option value="50-60">50-60 mm</option>
                                    <option value="60-70">60-70 mm</option>
                                    <option value="70-80">70-80 mm</option>
                                    <option value="80-90">80-90 mm</option>
                                    <option value="90-100">90-100 mm</option>
                                </select>
                            </label>
                        </div>
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">8 - střecha</p>
                        {formData.strecha.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('strecha', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.strecha[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                        <div className="flex flex-row flex-wrap w-full items-start detail-info">
                            <label className="form-field__input flex flex-row flex-wrap w-1/2 mt-0 pr-4">Počet poškození
                                <input
                                    type="number"
                                    name="strechaCount"
                                    placeholder="1"
                                    value={formData.strechaCount || ""}
                                    onChange={handleChange}
                                    min={1}
                                />
                            </label>
                            <label className="form-field__input flex flex-row flex-wrap w-1/2">Průměr
                                <select
                                    name="strechaDiameter"
                                    value={formData.strechaDiameter || ""}
                                    onChange={handleChange}
                                >
                                    <option value="" disabled>
                                        Vyberte průměr
                                    </option>
                                    <option value="20-30">20-30 mm</option>
                                    <option value="30-40">30-40 mm</option>
                                    <option value="40-50">40-50 mm</option>
                                    <option value="50-60">50-60 mm</option>
                                    <option value="60-70">60-70 mm</option>
                                    <option value="70-80">70-80 mm</option>
                                    <option value="80-90">80-90 mm</option>
                                    <option value="90-100">90-100 mm</option>
                                </select>
                            </label>
                        </div>
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">9 - pravý rám</p>
                        {formData.pravyRam.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('pravyRam', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.pravyRam[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                        <div className="flex flex-row flex-wrap w-full items-start detail-info">
                            <label className="form-field__input flex flex-row flex-wrap w-1/2 mt-0 pr-4">Počet poškození
                                <input
                                    type="number"
                                    name="pravyRamCount"
                                    placeholder="1"
                                    value={formData.pravyRamCount || ""}
                                    onChange={handleChange}
                                    min={1}
                                />
                            </label>
                            <label className="form-field__input flex flex-row flex-wrap w-1/2">Průměr
                                <select
                                    name="pravyRamDiameter"
                                    value={formData.pravyRamDiameter || ""}
                                    onChange={handleChange}
                                >
                                    <option value="" disabled>
                                        Vyberte průměr
                                    </option>
                                    <option value="20-30">20-30 mm</option>
                                    <option value="30-40">30-40 mm</option>
                                    <option value="40-50">40-50 mm</option>
                                    <option value="50-60">50-60 mm</option>
                                    <option value="60-70">60-70 mm</option>
                                    <option value="70-80">70-80 mm</option>
                                    <option value="80-90">80-90 mm</option>
                                    <option value="90-100">90-100 mm</option>
                                </select>
                            </label>
                        </div>
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">10 - pravý zadní blatník</p>
                        {formData.pravyZadniBlatnik.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('pravyZadniBlatnik', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.pravyZadniBlatnik[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                        <div className="flex flex-row flex-wrap w-full items-start detail-info">
                            <label className="form-field__input flex flex-row flex-wrap w-1/2 mt-0 pr-4">Počet poškození
                                <input
                                    type="number"
                                    name="pravyZadniBlatnikCount"
                                    placeholder="1"
                                    value={formData.pravyZadniBlatnikCount || ""}
                                    onChange={handleChange}
                                    min={1}
                                />
                            </label>
                            <label className="form-field__input flex flex-row flex-wrap w-1/2">Průměr
                                <select
                                    name="pravyZadniBlatnikDiameter"
                                    value={formData.pravyZadniBlatnikDiameter || ""}
                                    onChange={handleChange}
                                >
                                    <option value="" disabled>
                                        Vyberte průměr
                                    </option>
                                    <option value="20-30">20-30 mm</option>
                                    <option value="30-40">30-40 mm</option>
                                    <option value="40-50">40-50 mm</option>
                                    <option value="50-60">50-60 mm</option>
                                    <option value="60-70">60-70 mm</option>
                                    <option value="70-80">70-80 mm</option>
                                    <option value="80-90">80-90 mm</option>
                                    <option value="90-100">90-100 mm</option>
                                </select>
                            </label>
                        </div>
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">11 - Pravé zadní dvěře</p>
                        {formData.praveZadniDvere.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('praveZadniDvere', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.praveZadniDvere[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                        <div className="flex flex-row flex-wrap w-full items-start detail-info">
                            <label className="form-field__input flex flex-row flex-wrap w-1/2 mt-0 pr-4">Počet poškození
                                <input
                                    type="number"
                                    name="praveZadniDvereCount"
                                    placeholder="1"
                                    value={formData.praveZadniDvereCount || ""}
                                    onChange={handleChange}
                                    min={1}
                                />
                            </label>
                            <label className="form-field__input flex flex-row flex-wrap w-1/2">Průměr
                                <select
                                    name="praveZadniDvereDiameter"
                                    value={formData.praveZadniDvereDiameter || ""}
                                    onChange={handleChange}
                                >
                                    <option value="" disabled>
                                        Vyberte průměr
                                    </option>
                                    <option value="20-30">20-30 mm</option>
                                    <option value="30-40">30-40 mm</option>
                                    <option value="40-50">40-50 mm</option>
                                    <option value="50-60">50-60 mm</option>
                                    <option value="60-70">60-70 mm</option>
                                    <option value="70-80">70-80 mm</option>
                                    <option value="80-90">80-90 mm</option>
                                    <option value="90-100">90-100 mm</option>
                                </select>
                            </label>
                        </div>
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">12 - Pravé přední dvěře</p>
                        {formData.pravePredniDvere.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('pravePredniDvere', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.pravePredniDvere[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                        <div className="flex flex-row flex-wrap w-full items-start detail-info">
                            <label className="form-field__input flex flex-row flex-wrap w-1/2 mt-0 pr-4">Počet poškození
                                <input
                                    type="number"
                                    name="pravePredniDvereCount"
                                    placeholder="1"
                                    value={formData.pravePredniDvereCount || ""}
                                    onChange={handleChange}
                                    min={1}
                                />
                            </label>
                            <label className="form-field__input flex flex-row flex-wrap w-1/2">Průměr
                                <select
                                    name="pravePredniDvereDiameter"
                                    value={formData.pravePredniDvereDiameter || ""}
                                    onChange={handleChange}
                                >
                                    <option value="" disabled>
                                        Vyberte průměr
                                    </option>
                                    <option value="20-30">20-30 mm</option>
                                    <option value="30-40">30-40 mm</option>
                                    <option value="40-50">40-50 mm</option>
                                    <option value="50-60">50-60 mm</option>
                                    <option value="60-70">60-70 mm</option>
                                    <option value="70-80">70-80 mm</option>
                                    <option value="80-90">80-90 mm</option>
                                    <option value="90-100">90-100 mm</option>
                                </select>
                            </label>
                        </div>
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">13 - Pravý přední blatník</p>
                        {formData.pravyPredniBlatnik.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('pravyPredniBlatnik', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.pravyPredniBlatnik[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                        <div className="flex flex-row flex-wrap w-full items-start detail-info">
                            <label className="form-field__input flex flex-row flex-wrap w-1/2 mt-0 pr-4">Počet poškození
                                <input
                                    type="number"
                                    name="pravyPredniBlatnikCount"
                                    placeholder="1"
                                    value={formData.pravyPredniBlatnikCount || ""}
                                    onChange={handleChange}
                                    min={1}
                                />
                            </label>
                            <label className="form-field__input flex flex-row flex-wrap w-1/2">Průměr
                                <select
                                    name="pravyPredniBlatnikDiameter"
                                    value={formData.pravyPredniBlatnikDiameter || ""}
                                    onChange={handleChange}
                                >
                                    <option value="" disabled>
                                        Vyberte průměr
                                    </option>
                                    <option value="20-30">20-30 mm</option>
                                    <option value="30-40">30-40 mm</option>
                                    <option value="40-50">40-50 mm</option>
                                    <option value="50-60">50-60 mm</option>
                                    <option value="60-70">60-70 mm</option>
                                    <option value="70-80">70-80 mm</option>
                                    <option value="80-90">80-90 mm</option>
                                    <option value="90-100">90-100 mm</option>
                                </select>
                            </label>
                        </div>
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">14 - Dodatečné foto 1</p>
                        {formData.dodatecneFoto1.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('dodatecneFoto1', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.dodatecneFoto1[index - 1]}
                                    />
                                </label>
                            </div>
                        ))}
                    </div>
                    <div className="form-field">
                        <p className="form-field__label">15 - Dodatečné foto 2</p>
                        {formData.dodatecneFoto2.map((image, index) => (
                            <div key={index} className="form-field__input flex flex-row flex-wrap pb-4">
                                <label>
                                    Foto č. {index + 1} &nbsp;
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="camera"
                                        onChange={(e) => handleImageChange('dodatecneFoto2', index, e.target.files[0])}
                                        disabled={index > 0 && !formData.dodatecneFoto2[index - 1]}
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