"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EditPage() {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const role = localStorage.getItem("userRole");

        // Pokud role není admin ani editor, pošli ho pryč
        if (role !== "admin" && role !== "editor") {
            router.replace("/splitter"); // replace je lepší než push, aby se nemohl vrátit tlačítkem zpět
        } else {
            setIsAuthorized(true);
        }
    }, [router]);

    // Dokud neověříme roli, raději nic nevykreslujeme (ochrana před probliknutím obsahu)
    if (!isAuthorized) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Ověřování oprávnění...</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">Administrace údajů</h1>
            {/* Tady bude tvůj obsah pro editory a adminy */}
        </div>
    );
}