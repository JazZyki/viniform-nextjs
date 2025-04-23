"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Popup from "reactjs-popup";
import SignaturePad from "react-signature-canvas";

export default function FormPage() {
    const [step, setStep] = useState(1);
    const initialFormData = {
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
        globalPhotographyNotess: '',
        globalPhotographyNotess2: '',
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
        kapota: Array(10).fill(""),
        kapotaCount: 0,
        kapotaDiameter: 0,
        kapotaLak: false,
        kapotaVymena: false,
        levyPredniBlatnik: Array(10).fill(""),
        levyPredniBlatnikCount: 0,
        levyPredniBlatnikDiameter: 0,
        levyPredniBlatnikLak: false,
        levyPredniBlatnikVymena: false,
        levePredniDvere: Array(10).fill(""),
        levePredniDvereCount: 0,
        levePredniDvereDiameter: 0,
        levePredniDvereLak: false,
        levePredniDvereVymena: false,
        leveZadniDvere: Array(10).fill(""),
        leveZadniDvereCount: 0,
        leveZadniDvereDiameter: 0,
        leveZadniDvereLak: false,
        leveZadniDvereVymena: false,
        leveZadniBlatniky: Array(10).fill(""),
        leveZadniBlatnikyCount: 0,
        leveZadniBlatnikyDiameter: 0,
        leveZadniBlatnikyLak: false,
        leveZadniBlatnikyVymena: false,
        zadniKapota: Array(10).fill(""),
        zadniKapotaCount: 0,
        zadniKapotaDiameter: 0,
        zadniKapotaLak: false,
        zadniKapotaVymena: false,
        levyRam: Array(10).fill(""),
        levyRamCount: 0,
        levyRamDiameter: 0,
        levyRamLak: false,
        levyRamVymena: false,
        strecha: Array(10).fill(""),
        strechaCount: 0,
        strechaDiameter: 0,
        strechaLak: false,
        strechaVymena: false,
        pravyRam: Array(10).fill(""),
        pravyRamCount: 0,
        pravyRamDiameter: 0,
        pravyRamLak: false,
        pravyRamVymena: false,
        pravyZadniBlatnik: Array(10).fill(""),
        pravyZadniBlatnikCount: 0,
        pravyZadniBlatnikDiameter: 0,
        pravyZadniBlatnikLak: false,
        pravyZadniBlatnikVymena: false,
        praveZadniDvere: Array(10).fill(""),
        praveZadniDvereCount: 0,
        praveZadniDvereDiameter: 0,
        praveZadniDvereLak: false,
        praveZadniDvereVymena: false,
        pravePredniDvere: Array(10).fill(""),
        pravePredniDvereCount: 0,
        pravePredniDvereDiameter: 0,
        pravePredniDvereLak: false,
        pravePredniDvereVymena: false,
        pravyPredniBlatnik: Array(10).fill(""),
        pravyPredniBlatnikCount: 0,
        pravyPredniBlatnikDiameter: 0,
        pravyPredniBlatnikLak: false,
        pravyPredniBlatnikVymena: false,
        dodatecneFoto1: Array(10).fill(""),
        dodatecneFoto2: Array(10).fill(""),
        pravyPredniBlatnikLak: false,
        //customerSignature: null,
    }
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const filename = `${formData.vehicleSPZ}_${formData.customerName}`;
    const [imageURL, setImageURL] = useState(null);
    const sigCanvas = useRef({});
    const clear = () => sigCanvas.current.clear();
    const save = () => {
        setImageURL(sigCanvas.current.getTrimmedCanvas().toDataURL("image/png"));
    }

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
    const handleCheckboxChange = (e) => {
        const { name, checked } = e.target;
        setFormData({
            ...formData,
            [name]: checked,
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

    const nextStep = () => {
        setStep((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    const prevStep = () => {
        setStep((prev) => prev - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

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
            nextStep();
        } else {
            setLoading(true);
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
                    technician: { x: 133, y: 246 },
                    vehicleBrand: { x: 14, y: 65 },
                    vehicleType: { x: 65, y: 65 },
                    vehicleSPZ: { x: 122, y: 65 },
                    vehicleVIN: { x: 14, y: 80 },
                    vehicleColor: { x: 165, y: 80 },
                    vehicleDistance: { x: 107, y: 80 },
                    vehicleYear: { x: 136, y: 80 },
                    insuranceCompany: { x: 14, y: 93 },
                    insuranceNumber: { x: 88, y: 93 },
                    customerName: { x: 14, y: 52 },
                    customerPhone: { x: 122, y: 52 },
                    serviceDate: { x: 154, y: 93 },
                    detailNotes: { x: 134, y: 184 },
                    kapotaCount: { x: 50, y: 139 },
                    kapotaDiameter: { x: 75, y: 139 },
                    strechaCount: { x: 50, y: 145 },
                    strechaDiameter: { x: 75, y: 145 },
                    levyPredniBlatnikCount: { x: 50, y: 152 },
                    levyPredniBlatnikDiameter: { x: 75, y: 152 },
                    pravyPredniBlatnikCount: { x: 50, y: 159 },
                    pravyPredniBlatnikDiameter: { x: 75, y: 159 },
                    levePredniDvereCount: { x: 50, y: 165 },
                    levePredniDvereDiameter: { x: 75, y: 165 },
                    pravePredniDvereCount: { x: 50, y: 172 },
                    pravePredniDvereDiameter: { x: 75, y: 172 },
                    leveZadniDvereCount: { x: 50, y: 179 },
                    leveZadniDvereDiameter: { x: 75, y: 179 },
                    praveZadniDvereCount: { x: 50, y: 186 },
                    praveZadniDvereDiameter: { x: 75, y: 186 },
                    leveZadniBlatnikyCount: { x: 50, y: 192 },
                    leveZadniBlatnikyDiameter: { x: 75, y: 192 },
                    pravyZadniBlatnikCount: { x: 50, y: 199 },
                    pravyZadniBlatnikDiameter: { x: 75, y: 199 },
                    levyRamCount: { x: 50, y: 206 },
                    levyRamDiameter: { x: 75, y: 206 },
                    pravyRamCount: { x: 50, y: 211 },
                    pravyRamDiameter: { x: 75, y: 211 },
                    zadniKapotaCount: { x: 50, y: 219 },
                    zadniKapotaDiameter: { x: 75, y: 219 },
                };

                // Add text fields to the PDF
                Object.keys(positions).forEach((key) => {
                    if (key === 'detailNotes') {
                        const textLines = doc.splitTextToSize(formData[key], 62);
                        let curentY = positions[key].y;
                        textLines.forEach((line) => {
                            doc.text(line, positions[key].x, curentY);
                            curentY += 6; // Adjust line height
                        })
                    } else {
                        doc.text(`${formData[key]}`, positions[key].x, positions[key].y);
                    }
                });

                // Add checkboxes to the PDF
                if (formData.kapotaLak) {
                    doc.text("X", 100, 139);
                }
                if (formData.kapotaVymena) {
                    doc.text("X", 118, 139);
                }
                if (formData.levyPredniBlatnikLak) {
                    doc.text("X", 100, 152);
                }
                if (formData.levyPredniBlatnikVymena) {
                    doc.text("X", 118, 152);
                }
                if (formData.levePredniDvereLak) {
                    doc.text("X", 100, 165);
                }
                if (formData.levePredniDvereVymena) {
                    doc.text("X", 118, 165);
                }
                if (formData.leveZadniDvereLak) {
                    doc.text("X", 100, 179);
                }
                if (formData.leveZadniDvereVymena) {
                    doc.text("X", 118, 179);
                }
                if (formData.leveZadniBlatnikyLak) {
                    doc.text("X", 100, 192);
                }
                if (formData.leveZadniBlatnikyVymena) {
                    doc.text("X", 118, 192);
                }
                if (formData.levyRamLak) {
                    doc.text("X", 100, 206);
                }
                if (formData.levyRamVymena) {
                    doc.text("X", 118, 206);
                }
                if (formData.zadniKapotaLak) {
                    doc.text("X", 100, 219);
                }
                if (formData.zadniKapotaVymena) {
                    doc.text("X", 120, 219);
                }
                if (formData.pravyPredniBlatnikLak) {
                    doc.text("X", 100, 159);
                }
                if (formData.pravyPredniBlatnikVymena) {
                    doc.text("X", 118, 159);
                }
                if (formData.pravePredniDvereLak) {
                    doc.text("X", 100, 172);
                }
                if (formData.pravePredniDvereVymena) {
                    doc.text("X", 118, 172);
                }
                if (formData.praveZadniDvereLak) {
                    doc.text("X", 100, 186);
                }
                if (formData.praveZadniDvereVymena) {
                    doc.text("X", 118, 186);
                }
                if (formData.pravyZadniBlatnikLak) {
                    doc.text("X", 100, 199);
                }
                if (formData.pravyZadniBlatnikVymena) {
                    doc.text("X", 120, 199);
                }
                if (formData.pravyRamLak) {
                    doc.text("X", 100, 211);
                }
                if (formData.pravyRamVymena) {
                    doc.text("X", 118, 211);
                }
                if (formData.strechaLak) {
                    doc.text("X", 100, 145);
                }
                if (formData.strechaVymena) {
                    doc.text("X", 118, 145);
                }

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
                                zip.file(`pohledZePreduZleva${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`pohledZleva${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`pohledZezaduZleva${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`pohledZezadu${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`pohledZezaduZprava${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`pohledZprava${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`pohledZepreduZprava${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`STK${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`VIN${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`tachometr${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`interier${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`kapota${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`levyPredniBlatnik${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`levePredniDvere${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`leveZadniDvere${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`leveZadniBlatniky${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`zadniKapota${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`levyRam${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`strecha${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`pravyRam${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`pravyZadniBlatnik${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`praveZadniDvere${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`pravePredniDvere${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`pravyPredniBlatnik${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`dodatecneFoto1${i + 1}.jpg`, optimizedImage);
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
                                zip.file(`dodatecneFoto2${i + 1}.jpg`, optimizedImage);
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

                        <label className="form-field__input flex flex-row flex-wrap">SPZ vozidla <span className="required">*</span>
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

                        <label className="form-field__input flex flex-row flex-wrap">Rok výroby
                            <input
                                type="text"
                                name="vehicleYear"
                                placeholder="2015"
                                value={formData.vehicleYear || ""}
                                onChange={handleChange}
                            />
                        </label>

                        <label className="form-field__input flex flex-row flex-wrap">Stav tachometru
                            <div className="input-group reverse">
                                <input
                                    type="number"
                                    name="vehicleDistance"
                                    placeholder="X XXX km"
                                    value={formData.vehicleDistance || ""}
                                    onChange={handleChange}
                                />
                                <span className="input-group-text">km</span>
                            </div>
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
                                placeholder="Případné poznámky ke stavu vozidla"
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
                        <p className="mt-2">Poznámky se nepropíšou do zakázkového listu, pouze do exportovaného TXT souboru.</p>
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
                                    placeholder="0"
                                    value={formData.kapotaCount || ""}
                                    onChange={handleChange}
                                    min={0}
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
                                    <option value="20">20 mm</option>
                                    <option value="30">30 mm</option>
                                    <option value="40">40 mm</option>
                                    <option value="50">50 mm</option>
                                    <option value="60">60 mm</option>
                                    <option value="70">70 mm</option>
                                    <option value="80">80 mm</option>
                                    <option value="90">90 mm</option>
                                    <option value="100">100 mm</option>
                                </select>
                            </label>
                            <div className="flex flex-row justify-between w-full">
                                <label className="switch">
                                    <span className="font-bold text-xl">Lak</span>
                                    <input
                                        type="checkbox"
                                        name="kapotaLak"
                                        checked={formData.kapotaLak || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <label className="switch">
                                    <span className="font-bold text-xl">Výměna dílu</span>
                                    <input
                                        type="checkbox"
                                        name="kapotaVymena"
                                        checked={formData.kapotaVymena || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
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
                                    placeholder="0"
                                    value={formData.levyPredniBlatnikCount || ""}
                                    onChange={handleChange}
                                    min={0}
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
                                    <option value="20">20 mm</option>
                                    <option value="30">30 mm</option>
                                    <option value="40">40 mm</option>
                                    <option value="50">50 mm</option>
                                    <option value="60">60 mm</option>
                                    <option value="70">70 mm</option>
                                    <option value="80">80 mm</option>
                                    <option value="90">90 mm</option>
                                    <option value="100">100 mm</option>
                                </select>
                            </label>
                            <div className="flex flex-row justify-between w-full">
                                <label className="switch">
                                    <span className="font-bold text-xl">Lak</span>
                                    <input
                                        type="checkbox"
                                        name="levyPredniBlatnikLak"
                                        checked={formData.levyPredniBlatnikLak || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <label className="switch">
                                    <span className="font-bold text-xl">Výměna dílu</span>
                                    <input
                                        type="checkbox"
                                        name="levyPredniBlatnikVymena"
                                        checked={formData.levyPredniBlatnikVymena || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
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
                                    placeholder="0"
                                    value={formData.levePredniDvereCount || ""}
                                    onChange={handleChange}
                                    min={0}
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
                                    <option value="20">20 mm</option>
                                    <option value="30">30 mm</option>
                                    <option value="40">40 mm</option>
                                    <option value="50">50 mm</option>
                                    <option value="60">60 mm</option>
                                    <option value="70">70 mm</option>
                                    <option value="80">80 mm</option>
                                    <option value="90">90 mm</option>
                                    <option value="100">100 mm</option>
                                </select>
                            </label>
                            <div className="flex flex-row justify-between w-full">
                                <label className="switch">
                                    <span className="font-bold text-xl">Lak</span>
                                    <input
                                        type="checkbox"
                                        name="levePredniDvereLak"
                                        checked={formData.levePredniDvereLak || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <label className="switch">
                                    <span className="font-bold text-xl">Výměna dílu</span>
                                    <input
                                        type="checkbox"
                                        name="levePredniDvereVymena"
                                        checked={formData.levePredniDvereVymena || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
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
                                    placeholder="0"
                                    value={formData.leveZadniDvereCount || ""}
                                    onChange={handleChange}
                                    min={0}
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
                                    <option value="20">20 mm</option>
                                    <option value="30">30 mm</option>
                                    <option value="40">40 mm</option>
                                    <option value="50">50 mm</option>
                                    <option value="60">60 mm</option>
                                    <option value="70">70 mm</option>
                                    <option value="80">80 mm</option>
                                    <option value="90">90 mm</option>
                                    <option value="100">100 mm</option>
                                </select>
                            </label>
                            <div className="flex flex-row justify-between w-full">
                                <label className="switch">
                                    <span className="font-bold text-xl">Lak</span>
                                    <input
                                        type="checkbox"
                                        name="leveZadniDvereLak"
                                        checked={formData.leveZadniDvereLak || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <label className="switch">
                                    <span className="font-bold text-xl">Výměna dílu</span>
                                    <input
                                        type="checkbox"
                                        name="leveZadniDvereVymena"
                                        checked={formData.leveZadniDvereVymena || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
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
                                    placeholder="0"
                                    value={formData.leveZadniBlatnikyCount || ""}
                                    onChange={handleChange}
                                    min={0}
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
                                    <option value="20">20 mm</option>
                                    <option value="30">30 mm</option>
                                    <option value="40">40 mm</option>
                                    <option value="50">50 mm</option>
                                    <option value="60">60 mm</option>
                                    <option value="70">70 mm</option>
                                    <option value="80">80 mm</option>
                                    <option value="90">90 mm</option>
                                    <option value="100">100 mm</option>
                                </select>
                            </label>
                            <div className="flex flex-row justify-between w-full">
                                <label className="switch">
                                    <span className="font-bold text-xl">Lak</span>
                                    <input
                                        type="checkbox"
                                        name="leveZadniBlatnikyLak"
                                        checked={formData.leveZadniBlatnikyLak || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <label className="switch">
                                    <span className="font-bold text-xl">Výměna dílu</span>
                                    <input
                                        type="checkbox"
                                        name="leveZadniBlatnikyVymena"
                                        checked={formData.leveZadniBlatnikyVymena || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
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
                                    placeholder="0"
                                    value={formData.zadniKapotaCount || ""}
                                    onChange={handleChange}
                                    min={0}
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
                                    <option value="20">20 mm</option>
                                    <option value="30">30 mm</option>
                                    <option value="40">40 mm</option>
                                    <option value="50">50 mm</option>
                                    <option value="60">60 mm</option>
                                    <option value="70">70 mm</option>
                                    <option value="80">80 mm</option>
                                    <option value="90">90 mm</option>
                                    <option value="100">100 mm</option>
                                </select>
                            </label>
                            <div className="flex flex-row justify-between w-full">
                                <label className="switch">
                                    <span className="font-bold text-xl">Lak</span>
                                    <input
                                        type="checkbox"
                                        name="zadniKapotaLak"
                                        checked={formData.zadniKapotaLak || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <label className="switch">
                                    <span className="font-bold text-xl">Výměna dílu</span>
                                    <input
                                        type="checkbox"
                                        name="zadniKapotaVymena"
                                        checked={formData.zadniKapotaVymena || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
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
                                    placeholder="0"
                                    value={formData.levyRamCount || ""}
                                    onChange={handleChange}
                                    min={0}
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
                                    <option value="20">20 mm</option>
                                    <option value="30">30 mm</option>
                                    <option value="40">40 mm</option>
                                    <option value="50">50 mm</option>
                                    <option value="60">60 mm</option>
                                    <option value="70">70 mm</option>
                                    <option value="80">80 mm</option>
                                    <option value="90">90 mm</option>
                                    <option value="100">100 mm</option>
                                </select>
                            </label>
                            <div className="flex flex-row justify-between w-full">
                                <label className="switch">
                                    <span className="font-bold text-xl">Lak</span>
                                    <input
                                        type="checkbox"
                                        name="levyRamLak"
                                        checked={formData.levyRamLak || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <label className="switch">
                                    <span className="font-bold text-xl">Výměna dílu</span>
                                    <input
                                        type="checkbox"
                                        name="levyRamVymena"
                                        checked={formData.levyRamVymena || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
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
                                    placeholder="0"
                                    value={formData.strechaCount || ""}
                                    onChange={handleChange}
                                    min={0}
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
                                    <option value="20">20 mm</option>
                                    <option value="30">30 mm</option>
                                    <option value="40">40 mm</option>
                                    <option value="50">50 mm</option>
                                    <option value="60">60 mm</option>
                                    <option value="70">70 mm</option>
                                    <option value="80">80 mm</option>
                                    <option value="90">90 mm</option>
                                    <option value="100">100 mm</option>
                                </select>
                            </label>
                            <div className="flex flex-row justify-between w-full">
                                <label className="switch">
                                    <span className="font-bold text-xl">Lak</span>
                                    <input
                                        type="checkbox"
                                        name="strechaLak"
                                        checked={formData.strechaLak || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <label className="switch">
                                    <span className="font-bold text-xl">Výměna dílu</span>
                                    <input
                                        type="checkbox"
                                        name="strechaVymena"
                                        checked={formData.strechaVymena || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
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
                                    placeholder="0"
                                    value={formData.pravyRamCount || ""}
                                    onChange={handleChange}
                                    min={0}
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
                                    <option value="20">20 mm</option>
                                    <option value="30">30 mm</option>
                                    <option value="40">40 mm</option>
                                    <option value="50">50 mm</option>
                                    <option value="60">60 mm</option>
                                    <option value="70">70 mm</option>
                                    <option value="80">80 mm</option>
                                    <option value="90">90 mm</option>
                                    <option value="100">100 mm</option>
                                </select>
                            </label>
                            <div className="flex flex-row justify-between w-full">
                                <label className="switch">
                                    <span className="font-bold text-xl">Lak</span>
                                    <input
                                        type="checkbox"
                                        name="pravyRamLak"
                                        checked={formData.pravyRamLak || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <label className="switch">
                                    <span className="font-bold text-xl">Výměna dílu</span>
                                    <input
                                        type="checkbox"
                                        name="pravyRamVymena"
                                        checked={formData.pravyRamVymena || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
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
                                    placeholder="0"
                                    value={formData.pravyZadniBlatnikCount || ""}
                                    onChange={handleChange}
                                    min={0}
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
                                    <option value="20">20 mm</option>
                                    <option value="30">30 mm</option>
                                    <option value="40">40 mm</option>
                                    <option value="50">50 mm</option>
                                    <option value="60">60 mm</option>
                                    <option value="70">70 mm</option>
                                    <option value="80">80 mm</option>
                                    <option value="90">90 mm</option>
                                    <option value="100">100 mm</option>
                                </select>
                            </label>
                            <div className="flex flex-row justify-between w-full">
                                <label className="switch">
                                    <span className="font-bold text-xl">Lak</span>
                                    <input
                                        type="checkbox"
                                        name="pravyZadniBlatnikLak"
                                        checked={formData.pravyZadniBlatnikLak || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <label className="switch">
                                    <span className="font-bold text-xl">Výměna dílu</span>
                                    <input
                                        type="checkbox"
                                        name="pravyZadniBlatnikVymena"
                                        checked={formData.pravyZadniBlatnikVymena || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
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
                                    placeholder="0"
                                    value={formData.praveZadniDvereCount || ""}
                                    onChange={handleChange}
                                    min={0}
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
                                    <option value="20">20 mm</option>
                                    <option value="30">30 mm</option>
                                    <option value="40">40 mm</option>
                                    <option value="50">50 mm</option>
                                    <option value="60">60 mm</option>
                                    <option value="70">70 mm</option>
                                    <option value="80">80 mm</option>
                                    <option value="90">90 mm</option>
                                    <option value="100">100 mm</option>
                                </select>
                            </label>
                            <div className="flex flex-row justify-between w-full">
                                <label className="switch">
                                    <span className="font-bold text-xl">Lak</span>
                                    <input
                                        type="checkbox"
                                        name="praveZadniDvereLak"
                                        checked={formData.praveZadniDvereLak || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <label className="switch">
                                    <span className="font-bold text-xl">Výměna dílu</span>
                                    <input
                                        type="checkbox"
                                        name="praveZadniDvereVymena"
                                        checked={formData.praveZadniDvereVymena || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
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
                                    placeholder="0"
                                    value={formData.pravePredniDvereCount || ""}
                                    onChange={handleChange}
                                    min={0}
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
                                    <option value="20">20 mm</option>
                                    <option value="30">30 mm</option>
                                    <option value="40">40 mm</option>
                                    <option value="50">50 mm</option>
                                    <option value="60">60 mm</option>
                                    <option value="70">70 mm</option>
                                    <option value="80">80 mm</option>
                                    <option value="90">90 mm</option>
                                    <option value="100">100 mm</option>
                                </select>
                            </label>
                            <div className="flex flex-row justify-between w-full">
                                <label className="switch">
                                    <span className="font-bold text-xl">Lak</span>
                                    <input
                                        type="checkbox"
                                        name="pravePredniDvereLak"
                                        checked={formData.pravePredniDvereLak || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <label className="switch">
                                    <span className="font-bold text-xl">Výměna dílu</span>
                                    <input
                                        type="checkbox"
                                        name="pravePredniDvereVymena"
                                        checked={formData.pravePredniDvereVymena || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
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
                                    placeholder="0"
                                    value={formData.pravyPredniBlatnikCount || ""}
                                    onChange={handleChange}
                                    min={0}
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
                                    <option value="20">20 mm</option>
                                    <option value="30">30 mm</option>
                                    <option value="40">40 mm</option>
                                    <option value="50">50 mm</option>
                                    <option value="60">60 mm</option>
                                    <option value="70">70 mm</option>
                                    <option value="80">80 mm</option>
                                    <option value="90">90 mm</option>
                                    <option value="100">100 mm</option>
                                </select>
                            </label>
                            <div className="flex flex-row justify-between w-full">
                                <label className="switch">
                                    <span className="font-bold text-xl">Lak</span>
                                    <input
                                        type="checkbox"
                                        name="pravyPredniBlatnikLak"
                                        checked={formData.pravyPredniBlatnikLak || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <label className="switch">
                                    <span className="font-bold text-xl">Výměna dílu</span>
                                    <input
                                        type="checkbox"
                                        name="pravyPredniBlatnikVymena"
                                        checked={formData.pravyPredniBlatnikVymena || false}
                                        onChange={handleCheckboxChange}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
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
                    <div className="form-field">
                        <p className="form-field__label">Poznámky k fotografiím jednotlivých částí</p>
                        <p className="mt-2">Poznámky se nepropíšou do zakázkového listu, pouze do exportovaného TXT souboru.</p>
                        <label className="form-field__input flex flex-col">
                            <textarea
                                name="globalPhotographyNotess2"
                                placeholder="Případné poznámky..."
                                value={formData.globalPhotographyNotess2 || ""}
                                onChange={handleChange}
                            />
                        </label>
                    </div>
                    <div>
                        <Popup
                            modal
                            trigger={<button>Open Signature Pad</button>}
                            closeOnDocumentClick={false}
                        >
                            {close => (
                                <>
                                    <SignaturePad
                                        ref={sigCanvas}
                                        canvasProps={{
                                            className: "signatureCanvas"
                                        }}
                                    />
                                    {/* Button to trigger save canvas image */}
                                    <button onClick={save}>Save</button>
                                    <button onClick={clear}>Clear</button>
                                    <button onClick={close}>Close</button>
                                </>
                            )}
                        </Popup>
                        <br />
                        <br />
                        {/* if our we have a non-null image url we should 
      show an image and pass our imageURL state to it*/}
                        {imageURL ? (
                            <img
                                src={imageURL}
                                alt="my signature"
                                style={{
                                    display: "block",
                                    margin: "0 auto",
                                    border: "1px solid black",
                                    width: "150px"
                                }}
                            />
                        ) : null}
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