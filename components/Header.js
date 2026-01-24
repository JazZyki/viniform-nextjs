// components/Header.js
import { cookies } from 'next/headers';
import UserBadge from "./UserBadge";
import { logoutAction } from "../app/actions/logout";

export default async function Header() {
    const cookieStore = await cookies();
    const session = cookieStore.get('userSession');

    // Pokud neexistuje session (uživatel není přihlášen), Header nevrátí nic
    if (!session) return null;

    return (
        <header className="flex items-center justify-between p-4 bg-gray-100">
            <UserBadge />
            <form action={logoutAction}>
                <button className="btn btn-logout" type="submit">
                    Odhlásit
                </button>
            </form>
        </header>
    );
}