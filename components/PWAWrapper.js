"use client";
import usePWAInstall from "../hooks/PWAInstall";

export default function PWAWrapper({ children }) {
    const { installable, installPWA } = usePWAInstall();

    return (
        <div className="min-h-screen max-w-md m-auto bg-white">
            <div>{children}</div>
            {installable && (
                <button
                    className="fixed bottom-4 right-4 bg-maingreen text-white p-2 rounded"
                    onClick={installPWA}
                >
                    Instalovat aplikaci do telefonu
                </button>
            )}
        </div>
    );
}