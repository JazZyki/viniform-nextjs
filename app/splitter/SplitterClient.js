// app/splitter/SplitterClient.js
"use client";

import { useRouter } from "next/navigation";

export default function SplitterClient() {
  const router = useRouter();

  return (
    <div>
      <h1 className="text-2xl font-bold mt-6 text-center">Co chcete vyplňovat?</h1>
      <div className="flex flex-col justify-center gap-4 mt-8">
        <button 
          className="btn btn-primary" 
          onClick={() => router.push("/form1")}
        >
          Poškození po kroupách
        </button>
        <button 
          className="btn btn-primary" 
          onClick={() => router.push("/form2")}
        >
          Poškození z parkoviště
        </button>
      </div>
    </div>
  );
}