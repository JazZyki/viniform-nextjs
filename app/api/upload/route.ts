import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";

export async function POST(req: NextRequest) {
    try {
        // 1️⃣ Získání souboru z FormData
        const formData = await req.formData();
        const file = formData.get("file") as File;
        
        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // 2️⃣ Převod na ReadableStream
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const stream = Readable.from(buffer);

        // 3️⃣ Připojení ke Google Drive API
        const auth = new google.auth.GoogleAuth({
            keyFile: "google-credentials.json", // Ujisti se, že soubor existuje
            scopes: ["https://www.googleapis.com/auth/drive.file"],
        });

        const drive = google.drive({ version: "v3", auth });

        // 4️⃣ Upload na Google Drive s použitím streamu
        const response = await drive.files.create({
            requestBody: {
                name: file.name,
                mimeType: file.type,
            },
            media: {
                mimeType: file.type,
                body: stream, // Použití ReadableStream místo Bufferu
            },
        });
        console.log("Drive API Response:", response.data);

        const list = await drive.files.list({
            q: `name='${file.name}'`,
            fields: "files(id, name, parents)",
        });
        console.log("Nahrané soubory:", list.data.files);

        if (list.data.files && list.data.files.length > 0) {
            list.data.files.forEach(file => {
                console.log(`File ID: ${file.id}, Name: ${file.name}, Parents: ${file.parents}`);
            });
        }

        await drive.permissions.create({
            fileId: response.data.id,
            requestBody: {
                role: "reader",
                type: "anyone",
            },
        });
        console.log(`Soubor dostupný na: https://drive.google.com/file/d/${response.data.id}/view`);

        return NextResponse.json({ success: true, fileId: response.data.id });

    } catch (error) {
        console.error("Error uploading file:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
