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
    className = '',
    warning = null,
}) => {
    const isDisabled = disabled && name !== 'vehicleSPZ';
    const fieldClass = isDisabled ? 'opacity-50 cursor-not-allowed' : '';
    const widthClass = fullWidth ? 'md:col-span-2' : '';

    return (
        <label
            className={`flex flex-col text-sm font-semibold ${fieldClass} ${widthClass}`}
        >
            <div className="flex flex-col items-start gap-1 mb-1">
                <span>
                    {label} {required && <span className="text-red-600">*</span>}
                </span>
                
            </div>
            {type === 'select' ? (
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    required={required}
                    disabled={isDisabled}
                    className={`p-2 border rounded ${className}`}
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
                    } ${className}`}
                />
            )}
            {warning && (
                        <span title={typeof warning === 'string' ? warning : 'Upozornění: Rok výroby < 2020'} className="flex items-center gap-1 mt-1">
                        <svg width="20" height="20" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg" fill="#dc2626">
                        <path d="M116 136v-32a12 12 0 0 1 24 0v32a12 12 0 0 1-24 0m124.232 77.979a27.71 27.71 0 0 1-24.255 14.013H40.023a28 28 0 0 1-24.233-42.026l87.977-151.993a28 28 0 0 1 48.466 0l87.977 151.992a27.71 27.71 0 0 1 .022 28.014m-20.794-15.99L131.462 45.995a4 4 0 0 0-6.924 0L36.562 197.988a4 4 0 0 0 3.461 6.004h175.954a4 4 0 0 0 3.461-6.004M128 160a16 16 0 1 0 16 16 16 16 0 0 0-16-16"/></svg>
                        <span className="ml-1 text-red-600">
                             možnost totální škody </span>
                        </span>
                )}
        </label>
    );
};
