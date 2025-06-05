const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

const genAI = new GoogleGenerativeAI("AIzaSyCfPx5_aLgfwiaNglp1V6iRZhBeYRghINo");

async function processImage(imageBuffer, mimeType, prompt = "Ubahlah Karakter Dari Gambar Tersebut Diubah Kulitnya Menjadi Hitam se hitam-hitam nya") {
    try {
        // Validate input
        if (!/image\/(jpe?g|png)/.test(mimeType)) {
            throw new Error(`Format ${mimeType} tidak didukung! Hanya jpeg/jpg/png`);
        }

        // Prepare the request
        const base64Image = imageBuffer.toString("base64");
        const contents = [
            { text: prompt },
            {
                inlineData: {
                    mimeType: mimeType,
                    data: base64Image
                }
            }
        ];

        // Initialize model
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp-image-generation",
            generationConfig: {
                responseModalities: ["Text", "Image"]
            },
        });

        // Process image
        const response = await model.generateContent(contents);

        // Extract results
        let resultImage;
        let resultText = "";

        for (const part of response.response.candidates[0].content.parts) {
            if (part.text) {
                resultText += part.text;
            } else if (part.inlineData) {
                resultImage = Buffer.from(part.inlineData.data, "base64");
            }
        }

        if (!resultImage) {
            throw new Error("Gagal memproses gambar");
        }

        return {
            success: true,
            image: resultImage,
            text: resultText
        };

    } catch (error) {
        console.error("Processing error:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = processImage;
