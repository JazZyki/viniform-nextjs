// components/UserBadge.js
import { cookies } from 'next/headers';

export default async function UserBadge() {
    const cookieStore = await cookies();
    const username = cookieStore.get('userSession')?.value;

    if (!username) return null;

    return (
        <div className="p-2 bg-slate-100 rounded text-md text-right">
            Přihlášen jako: <strong className="text-maingreen">{username}</strong>
        </div>
    );
}