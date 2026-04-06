import React from 'react';
import { useEffect, useState } from 'react';
import Popup from 'reactjs-popup';

export const ImagePreview = ({ file, onRemove }) => {
    const [url, setUrl] = useState('');

    useEffect(() => {
        if (file instanceof File) {
            const u = URL.createObjectURL(file);
            setUrl(u);
            return () => URL.revokeObjectURL(u);
        }
    }, [file]);

    if (!url) return null;

    return (
        <div className="relative w-full h-20 group">
            {/* Popup pro zvětšení fotky */}
            <Popup
                trigger={
                    <img
                        src={url}
                        alt="Náhled"
                        className="w-full h-full object-cover rounded border-2 border-maingreen cursor-zoom-in"
                    />
                }
                modal
                nested
                contentStyle={{
                    width: '95vw',
                    background: 'transparent',
                    border: 'none',
                }}
                overlayStyle={{ background: 'rgba(0,0,0,0.9)' }}
            >
                {(close) => (
                    <div className="relative block" onClick={close}>
                        <button
                            className="absolute top-4 right-4 text-white text-4xl font-light z-50 p-4"
                            onClick={close}
                        >
                            ✕
                        </button>
                        <img
                            src={url}
                            alt="Detail"
                            className="max-w-full max-h-[85vh] object-contain shadow-2xl"
                            onClick={(e) => e.stopPropagation()} // Klik na fotku nezavře modál
                        />
                    </div>
                )}
            </Popup>

            {/* Tlačítko pro smazání */}
            <button
                type="button"
                onClick={onRemove}
                className="absolute -top-2 -right-2 bg-[#8F2215] text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md hover:bg-red-700 z-10"
                title="Smazat fotku"
            >
                ×
            </button>
        </div>
    );
};
