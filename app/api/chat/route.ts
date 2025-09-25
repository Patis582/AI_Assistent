import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getHistoricalTrades } from "@/lib/notion";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    const historicalTrades = await getHistoricalTrades();
    
    const prompt = `
OTÁZKA UŽIVATELE: ${question}

DATABÁZE OBCHODŮ (${historicalTrades.length} obchodů):
${historicalTrades.slice(0, 50).map((trade, index) => `
${index + 1}. ${trade.position} | RR:${trade.rr} | PnL:${trade.pnl} | ${trade.confluences.join(",")} | ${trade.session.join(",")} | SL:${trade.sl} | ${trade.order_type.join(",")} | ${trade.date} | ${trade.outcome} | Chyby:${trade.mistakes.join(",")} | Poznámky:${trade.notes}`).join("")}

ÚKOL: 
Odpověz na otázku uživatele na základě historických trading dat. 
Buď konkrétní, používej čísla a statistiky z dat.
Pokud potřebuješ spočítat success rate, PnL, nebo jiné metriky, proveď výpočty.
Pokud se otázka netýká trading dat, zdvořile nasměruj na trading témata.

Odpovídej v češtině, jasně a strukturovaně. Maximálně 8 vět.
    `;
    
    const result = await model.generateContent(prompt);
    return NextResponse.json({ 
      response: result.response.text(),
      stats: { 
        totalTrades: historicalTrades.length,
        processedTrades: Math.min(50, historicalTrades.length)
      }
    });
  } catch (error) {
    console.error("Chyba při chat analýze:", error);
    return NextResponse.json({ error: "Chyba při komunikaci s AI" }, { status: 500 });
  }
}