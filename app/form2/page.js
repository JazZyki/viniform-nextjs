"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Form2Page() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div>
      <h1>Form 2</h1>
      <p>This is the second form.</p>
    </div>
  );
}
