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
      <h1>Co chcete vyplňovat?</h1>
      <div className="flex flex-col justify-center gap-4 mt-4">
        <button className="btn btn-primary" onClick={() => navigateToForm("/form1")}>Poškození po kroupách</button>
        <button className="btn btn-primary" onClick={() => navigateToForm("/form2")}>Poškození z parkoviště</button>
      </div>
    </div>
  );
}
