"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import PWAWrapper from "../../components/PWAWrapper";
import { loginAction } from "../actions/auth";
import { USER_ROLES } from "../config";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const router = useRouter();

    const handleLogin = async () => {
        const result = await loginAction(username, password);
        
        if (result.success) {
            localStorage.setItem("username", result.username);
            const role = USER_ROLES[result.username] || "user";
            localStorage.setItem("userRole", role);
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
                    placeholder="uživatelské jméno..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="password"
                    id="password"
                    name="password"
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