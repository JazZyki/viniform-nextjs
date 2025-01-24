"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SplitterPage() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [router]);

  const navigateToForm = (formPath) => {
    router.push(formPath);
  };

  return (
    <div>
      <h1>Choose a Form</h1>
      <button onClick={() => navigateToForm("/form1")}>Go to Form 1</button>
      <button onClick={() => navigateToForm("/form2")}>Go to Form 2</button>
    </div>
  );
}
