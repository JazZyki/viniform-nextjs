"use client";
import usePWAInstall from "../hooks/PWAInstall";

export default function PWAWrapper({ children }) {
    const { installable, installPWA } = usePWAInstall();

    return (
        <div className="min-h-screen max-w-md m-auto bg-white">
            <div>
                <img src="../logo.png" alt="VinicarsLogo" width={100} className="pt-8 w-[90%] m-auto" />
                <h1 className="text-4xl pb-2 border-b-4 border-maingreen">Zakázkový list</h1>
            </div>
            <div className="p-4">{children}</div>
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