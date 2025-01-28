"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FormPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        technician: "", // Auto-filled from login
        surname: "",
        agree: false,
        option: "",
        images: ["", "", ""],
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

    const handleImageChange = (index, file) => {
        const updatedImages = [...formData.images];
        updatedImages[index] = file;
        setFormData((prev) => ({ ...prev, images: updatedImages }));
    };

    const nextStep = () => setStep((prev) => prev + 1);
    const prevStep = () => setStep((prev) => prev - 1);

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Form Data Submitted:", formData);
        alert("Form submitted!");
    };

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
                            <label className="form-field__input flex flex-col">Uživatelské jméno
                                <input
                                    type="text"
                                    name="technician"
                                    value={formData.technician}
                                    readOnly
                                    className="bg-gray-200 pointer-events-none"
                                />
                            </label>
                        </div>
                        <div className="form-field">
                            <p className="form-field__label">Údaje o vozidle</p>
                            <label className="form-field__input flex flex-col required">Značka vozidla
                                <select
                                    name="option"
                                    value={formData.option}
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

                            <label className="form-field__input flex flex-col required">Druh vozidla
                                <input
                                    type="text"
                                    name="type"
                                    placeholder="Octavia, Fabia, Kamiq, ..."
                                    value={formData.type}
                                    onChange={handleChange}
                                    required
                                />
                            </label>
                        </div>

                        <label className="flex flex-col"><span>Vaše údaje</span>
                        </label>
                        <input
                            type="text"
                            name="surname"
                            placeholder="Surname"
                            value={formData.surname}
                            onChange={handleChange}
                        />
                        <label>
                            <input
                                type="checkbox"
                                name="agree"
                                checked={formData.agree}
                                onChange={handleChange}
                            />
                            I agree to the terms
                        </label>

                        <button type="button" onClick={nextStep}>
                            Next
                        </button>
                    </form>
                </>
            )}

            {step === 2 && (
                <form onSubmit={handleSubmit}>
                    <h2>Step 2: Upload Images</h2>
                    {[0, 1, 2].map((index) => (
                        <div key={index}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    handleImageChange(index, e.target.files[0] || "")
                                }
                            />
                            {formData.images[index] && (
                                <p>Selected: {formData.images[index].name}</p>
                            )}
                        </div>
                    ))}

                    <button type="button" onClick={prevStep}>
                        Back
                    </button>
                    <button type="submit">Submit</button>
                </form>
            )}
        </div>
    );
}
