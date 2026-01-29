"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PWAWrapper from "../../components/PWAWrapper";
import { setCookie } from "cookies-next";
import { loginAction } from "../actions/auth";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const users = {
        admin: { password: "heslo", name: "Admin" },
        user1: { password: "veslo", name: "User 1" },
        user2: { password: "meslo", name: "User 2" },
    };

    const handleLogin = async () => {
        const result = await loginAction(username, password);
        
        if (result.success) {
            localStorage.setItem("username", result.name); // Pro zobrazení jména v UI
            router.push("/splitter");
        } else {
            alert(result.error);
        }
    };

    return (
        <PWAWrapper>
            <h1 className="mt-4">Přihlašte se do aplikace</h1>
            <div className="flex justify-center items-center flex-col mt-6 gap-4">
                <input
                    type="text"
                    id="username"
                    name="username"
                    className="p-2 border rounded"
                    placeholder="uživatelské jméno..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    id="password"
                    name="password"
                    className="p-2 border rounded"
                    placeholder="heslo..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                    className="block mt-4 btn btn-primary w-full"
                    onClick={handleLogin}
                >
                    Přihlásit se
                </button>
            </div>
        </PWAWrapper>
    );
}