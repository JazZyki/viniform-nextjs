import { useState, useEffect } from "react";

export default function usePWAInstall() {
    const [installable, setInstallable] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        // Ensure this code runs only in the browser
        if (typeof window === "undefined") return;

        const handleBeforeInstallPrompt = (event) => {
            event.preventDefault(); // Prevent the default browser prompt
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
                    console.log("User accepted the PWA installation");
                } else {
                    console.log("User dismissed the PWA installation");
                }
                setDeferredPrompt(null);
                setInstallable(false);
            });
        }
    };

    return { installable, installPWA };
}