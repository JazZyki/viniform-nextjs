// app/form1/getTechnician.js
import { cookies } from 'next/headers';

export async function getTechnicianName() {
    const cookieStore = await cookies();
    return cookieStore.get('userSession')?.value || "Neznámý technik";
}