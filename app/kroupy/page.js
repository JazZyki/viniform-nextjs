import { getTechnicianName } from "./technician";
import FormClient from "./FormClient";

export default async function FormPage() {
    // Načteme jméno technika na straně serveru
    const technicianName = await getTechnicianName();

    // Předáme ho do klientské komponenty
    return <FormClient initialTechnician={technicianName} />;
}