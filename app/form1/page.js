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
            <h1 className="pb-8 pt-4 mt-4 mb-4 border-b-2 border-maingreen text-center">logo</h1>

            {step === 1 && (
                <>
                    <div className="flex stepper">
                        <div className="flex flex-col step">
                            <div className="stepper__step-icon flex justify-center items-center bg-secondarygreen radius-full">
                                <p className=" text-white text-3xl font-bold size-30">1</p>
                            </div>
                            <div className="stepper__step-text">
                                <p className="text-sm">Základní údaje</p>
                            </div>
                        </div>
                        <div className="stepper__step stepper__step--second">
                            <div className="stepper__step-icon">
                                <p>2
                                </p>
                            </div>
                            <div className="stepper__step-text">
                                <p>Foto globální
                                </p>
                            </div>
                        </div>
                        <div className="stepper__step stepper__step--third">
                            <div className="stepper__step-icon">
                                <p>3
                                </p>
                            </div>
                            <div className="stepper__step-text">
                                <p>Foto detaily
                                </p>
                            </div>
                        </div>
                    </div>
                    <form>
                        <h2 className="active">Krok 1: Základní informace</h2>
                        <h3 className="unactive">Krok 2: fotografie celku</h3>
                        <h3 className="unactive">Krok 3: fotografie detailů</h3>

                        <label className="flex flex-col"><span>Vaše údaje</span>
                            <input
                                type="text"
                                name="technician"
                                value={formData.technician}
                                readOnly
                                className="p-2 border border-maingreen bg-gray-200 pointer-events-none"
                            />
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
                        <select
                            name="option"
                            value={formData.option}
                            onChange={handleChange}
                        >
                            <option value="" disabled>
                                Select an option
                            </option>
                            <option value="option1">Option 1</option>
                            <option value="option2">Option 2</option>
                            <option value="option3">Option 3</option>
                        </select>

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
