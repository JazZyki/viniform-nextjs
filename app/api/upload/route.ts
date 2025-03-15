import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import os from "os";
import { writeFile, unlink } from "fs/promises";
import mime from 'mime-types';

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

export async function POST(req: NextRequest) {
    let tempFilePath = null;
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'), // Replace escaped newlines
                project_id: process.env.GOOGLE_PROJECT_ID,
                private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
                client_id: process.env.GOOGLE_CLIENT_ID,
            },
            scopes: SCOPES,
        });

        const drive = google.drive({ version: "v3", auth });
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const tempDir = os.tmpdir();
        tempFilePath = path.join(tempDir, file.name);
        await writeFile(tempFilePath, buffer);

        const mimeType = mime.lookup(file.name) || 'application/octet-stream';

        const response = await drive.files.create({
            requestBody: {
                name: file.name,
                parents: ["1NDhnG2QhgFEb0eUUJFwsaanWFhz3FOVQ"], // ID složky
            },
            media: {
                mimeType: mimeType,
                body: fs.createReadStream(tempFilePath),
            },
        });

        return NextResponse.json({ success: true, fileId: response.data.id });

    } catch (error) {
        console.error("Error uploading file to Google Drive:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        if (tempFilePath) {
            try{
              await unlink(tempFilePath);
            } catch(e) {
              console.error("Error deleting temp file:", e);
            }

        }
    }
}