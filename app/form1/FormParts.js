// components/FormPart.js
"use client";

export default function FormPart({ id, label, formData, onImageChange, onChange, onCheckboxChange }) {
    return (
        <div className="form-field border-b pb-6 mb-6">
            <p className="form-field__label font-bold text-lg text-blue-800">{label}</p>

            {/* Nahrávání fotek - generuje se 10 vstupů pro každý díl */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {formData[id].map((file, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs border p-1 rounded bg-gray-50">
                        <span className="w-4">{index + 1}.</span>
                        <input
                            type="file"
                            accept="image/*"
                            capture="camera"
                            className="w-full"
                            onChange={(e) => onImageChange(id, index, e.target.files[0])}
                        />
                    </div>
                ))}
            </div>

            <div className="flex flex-row gap-4">
                <label className="w-1/2">
                    <span className="block text-sm">Počet důlků</span>
                    <input
                        type="number"
                        name={`${id}Count`}
                        value={formData[`${id}Count`] || 0}
                        onChange={onChange}
                        className="w-full p-2 border rounded"
                        min="0"
                    />
                </label>
                <label className="w-1/2">
                    <span className="block text-sm">Průměr</span>
                    <select
                        name={`${id}Diameter`}
                        value={formData[`${id}Diameter`] || ""}
                        onChange={onChange}
                        className="w-full p-2 border rounded"
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
            </div>

            <div className="flex gap-8 mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        name={`${id}Lak`}
                        checked={formData[`${id}Lak`] || false}
                        onChange={onCheckboxChange}
                        className="w-5 h-5"
                    />
                    <span className="text-sm font-semibold">Lakování</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        name={`${id}Vymena`}
                        checked={formData[`${id}Vymena`] || false}
                        onChange={onCheckboxChange}
                        className="w-5 h-5"
                    />
                    <span className="text-sm font-semibold">Výměna</span>
                </label>
            </div>
        </div>
    );
}