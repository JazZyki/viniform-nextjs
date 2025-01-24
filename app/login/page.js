"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const router = useRouter()

  const users = {
    admin: { password: "heslo", name: "Admin" },
    user1: { password: "veslo", name: "User 1" },
    user2: { password: "meslo", name: "User 2" },
  }

  const handleLogin = () => {
    if (users[username] && users[username].password === password) {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("username", users[username].name);
      router.push("/splitter");
    } else {
      alert("Chybné přihlašovací údaje");
    }
  };

  return (
    <div>
      <h1 className="text-3xl">Přihlašte se do aplikace</h1>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="btn btn-primary" onClick={handleLogin}>Přihlásit se...</button>
    </div>
  );
}