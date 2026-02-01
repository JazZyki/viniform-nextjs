import jsPDF from 'jspdf';
import { robotoBase64 } from './fonts/Roboto-Condensed-normal';
import { CAR_PARTS } from '../app/form1/config'; // uprav cestu dle potřeby

export const generateFinalPDF = async (formData, pricing) => {
    const doc = new jsPDF();
    doc.addFileToVFS('Roboto-Condensed.ttf', robotoBase64);
    doc.addFont('Roboto-Condensed.ttf', 'RobotoCustom', 'normal');

    const backgroundImage = new Image();
    backgroundImage.src = '/zakazkovy_list.jpg';

    return new Promise((resolve) => {
        backgroundImage.onload = () => {
            doc.addImage(backgroundImage, 'PNG', 0, 0, 210, 297);
            doc.setFont('RobotoCustom');
            doc.setFontSize(13);

            // Celková cena
            doc.text(`${pricing.total.toLocaleString()} Kč`, 14, 246);

            // Mapování textů (údaje o vozidle a zákazníkovi)
            const txtPos = {
                technician: [133, 246],
                customerName: [14, 52],
                customerPhone: [122, 52],
                vehicleBrand: [14, 65],
                vehicleType: [65, 65],
                vehicleSPZ: [122, 65],
                vehicleVIN: [14, 80],
                vehicleDistance: [107, 80],
                vehicleYear: [136, 80],
                vehicleColor: [165, 80],
                insuranceCompany: [14, 93],
                insuranceNumber: [88, 93],
                serviceDate: [154, 93],
            };

            Object.entries(txtPos).forEach(([key, [x, y]]) => {
                if (formData[key]) doc.text(`${formData[key]}`, x, y);
            });

            // Dynamické vykreslení dílů
            CAR_PARTS.forEach((part) => {
                const count = formData[`${part.id}Count`];
                const diam = formData[`${part.id}Diameter`];
                if (
                    count > 0 ||
                    formData[`${part.id}Lak`] ||
                    formData[`${part.id}Vymena`]
                ) {
                    if (count > 0) doc.text(`${count}`, part.x, part.y);
                    if (diam) doc.text(`${diam}`, part.x + 25, part.y);
                    if (formData[`${part.id}Lak`])
                        doc.text('X', part.lakX, part.y);
                    if (formData[`${part.id}Vymena`])
                        doc.text('X', part.vymenaX, part.y);
                }
            });

            // Poznámky
            if (formData.detailNotes) {
                const splitNotes = doc.splitTextToSize(
                    formData.detailNotes,
                    60
                );
                doc.text(splitNotes, 134, 139); // Upraveno na tvou souřadnici
            }

            // Podpis (pokud v JSONu je - Base64 string)
            if (formData.signatureImage) {
                doc.addImage(formData.signatureImage, 'PNG', 35, 266, 50, 20);
            }

            doc.save(`${formData.vehicleSPZ}_list.pdf`);
            resolve();
        };
    });
};
