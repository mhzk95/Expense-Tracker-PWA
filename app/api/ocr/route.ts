import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { image, mimeType } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: "Missing GEMINI_API_KEY. Please get a free key from Google AI Studio and add it to your environment variables." 
      }, { status: 400 });
    }

    const prompt = `
Analyze this receipt image and extract the following:
1. The total amount paid as a number.
2. A beautifully formatted summary that includes:
   - The Shop/Merchant Name
   - Date and Time (if visible)
   - Any other important details (Order #, Tax, Discounts)
   - A list of individual items and their prices

Respond ONLY with a valid JSON object in this exact format:
{
  "total": 12.34,
  "items": "Shop: Starbucks\\nDate: Oct 24, 2023\\nOrder #: 12345\\n\\nItems:\\n- Coffee: $5.00\\n- Muffin: $7.34\\n\\nTax: $1.00"
}
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: image
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini Error: ${response.status} ${response.statusText} - ${errorText}`);
      throw new Error(`Google Gemini API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    
    // Extract the JSON text from Gemini's response structure
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error("Gemini returned an empty response.");
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch (e) {
      console.error("Failed to parse Gemini JSON:", responseText);
      throw new Error("Gemini returned invalid JSON");
    }

    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error("OCR Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
