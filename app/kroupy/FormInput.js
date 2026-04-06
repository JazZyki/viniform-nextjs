export const FormInput = ({
    label,
    name,
    type = 'text',
    value,
    onChange,
    required,
    disabled,
    placeholder,
    options,
    fullWidth = false,
}) => {
    const isDisabled = disabled && name !== 'vehicleSPZ';
    const fieldClass = isDisabled ? 'opacity-50 cursor-not-allowed' : '';
    const widthClass = fullWidth ? 'md:col-span-2' : '';

    return (
        <label
            className={`flex flex-col text-sm font-semibold ${fieldClass} ${widthClass}`}
        >
            <div>
                {label} {required && <span className="text-red-600">*</span>}
            </div>
            {type === 'select' ? (
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    disabled={isDisabled}
                    className="p-2 border rounded"
                >
                    <option value="">{placeholder}</option>
                    {options.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    disabled={isDisabled}
                    placeholder={placeholder}
                    className={`p-2 border rounded ${
                        name === 'vehicleSPZ'
                            ? 'border-maingreen font-bold'
                            : ''
                    }`}
                />
            )}
        </label>
    );
};
