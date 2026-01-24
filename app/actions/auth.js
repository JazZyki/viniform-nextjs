'use server'

import { cookies } from 'next/headers'

export async function loginAction(username, password) {
    try {
        const usersData = JSON.parse(process.env.USERS_JSON || '{}');
        
        // Kontrola: existuje jméno a sedí k němu heslo?
        if (usersData[username] && usersData[username] === password) {
            const cookieStore = await cookies();
            
            // Do cookie "session" uložíme přímo username
            await cookieStore.set('userSession', username, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 60 * 60 * 12, // 12 hodin
                path: '/',
            });

            return { success: true, username };
        }

        return { success: false, error: "Neplatné jméno nebo heslo" };
    } catch (error) {
        return { success: false, error: "Chyba konfigurace" };
    }
}