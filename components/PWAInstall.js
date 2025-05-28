'use client';
import { useState, useEffect } from 'react';

// Hook for handling PWA installation prompt
const usePWAInstall = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [installable, setInstallable] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (event) => {
            event.preventDefault();
            setDeferredPrompt(event);
            setInstallable(true);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        };
    }, []);

    const installPWA = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === "accepted") {
                    console.log("Uživatel nainstaloval PWA");
                } else {
                    console.log("Uživatel odmítl instalaci");
                }
                setDeferredPrompt(null);
                setInstallable(false);
            });
        }
    };

    return { installable, installPWA };
};

export default usePWAInstall;