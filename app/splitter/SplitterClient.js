'use client';
import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function SplitterClient() {
    const router = useRouter();
    const [role, setRole] = useState('user');

    useEffect(() => {
        const savedRole = localStorage.getItem('userRole');
        setRole(savedRole || 'user');
    }, []);

    const hasAccessToEdit = role === 'admin' || role === 'editor';

    return (
        <div>
            <h1 className="text-2xl font-bold mt-6 text-center">
                Co chcete vyplňovat?
            </h1>
            <div className="flex flex-col justify-center gap-4 mt-8">
                <button
                    className="btn btn-primary"
                    onClick={() => router.push('/form1')}
                >
                    Poškození po kroupách
                </button>
                <button
                    className="btn btn-primary"
                    onClick={() => router.push('/form2')}
                >
                    Poškození z parkoviště
                </button>
                {hasAccessToEdit && (
                    <button
                        className="btn btn-secondary"
                        onClick={() => router.push('/edit')}
                    >
                        Editace údajů
                    </button>
                )}
            </div>
        </div>
    );
}
