import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const prompt = `

    
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ output: text });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Chyba při komunikaci s Gemini" }, { status: 500 });
  }
}
