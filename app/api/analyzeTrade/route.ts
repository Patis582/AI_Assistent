import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client } from "@notionhq/client";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const notion = new Client({ auth: process.env.NOTION_TOKEN });

// Copy helper functions from notion/route.ts
async function getPageTitle(pageId: string): Promise<string> {
  try {
    const page = await notion.pages.retrieve({ page_id: pageId });
    const props = (page as any).properties;
    const titleProp = Object.values(props).find((prop: any) => prop.type === 'title') as any;
    return titleProp?.title?.[0]?.plain_text || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

async function getRelationTitles(relations: any[]): Promise<string[]> {
  if (!relations?.length) return [];
  return Promise.all(relations.map(r => getPageTitle(r.id)));
}

async function getHistoricalTrades() {
  try {
    const response = await (notion as any).databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
    });

    const trades = await Promise.all(
      response.results.map(async (page: any) => {
        const p = page.properties;
        return {
          id: page.id,
          position: p.Position?.select?.name || "",
          date: p["Entry / Exit Date"]?.date?.start || "",
          rr: p["Actual RR achieved: W(+1), L(-1), BE(0)"]?.number ?? null,
          outcome: p.Outcome?.formula?.string || "",
          confluences: await getRelationTitles(p.Confluences?.relation || []),
          order_type: await getRelationTitles(p["Order Type"]?.relation || []),
          session: await getRelationTitles(p["Session"]?.relation || []),
          sl: p["S/L Pips"]?.number ?? null,
          risk: p["% Risk"]?.number ?? null,
          pnl: p["Gross PnL"]?.number ?? null,
        };
      })
    );

    return trades;
  } catch (error) {
    console.error("Chyba při načítání dat z Notion:", error);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    const newTrade = await req.json();
    
    // Načti historická data
    const historicalTrades = await getHistoricalTrades();
    
    // Vytvoř prompt s daty pro Gemini
    const prompt = `
NOVÝ OBCHOD K ANALÝZE:
- Pozice: ${newTrade.position}
- Session: ${newTrade.session}
- Plánované RR: ${newTrade.rr}
- Confluences: ${newTrade.confluences.join(", ")}
- Order Type: ${newTrade.orderType}
- Stop Loss: ${newTrade.sl} pips

HISTORICKÁ DATA (${historicalTrades.length} obchodů):
${historicalTrades.map((trade, index) => `
${index + 1}. ID: ${trade.id}
   - Pozice: ${trade.position}
   - RR dosažené: ${trade.rr}
   - Výsledek: ${trade.outcome}
   - Confluences: ${trade.confluences.join(", ")}
   - Session: ${trade.session.join(", ")}
   - Order Type: ${trade.order_type.join(", ")}
   - SL pips: ${trade.sl}
   - PnL: ${trade.pnl}
   - Datum: ${trade.date}
`).join("")}

ÚKOLY:
1. Najdi v historických datech podobné obchody jako je nový obchod (podobná pozice, confluences, session)
2. Spočítaj success rate těchto podobných obchodů
3. Vyhodnoť šanci na úspěch nového obchodu
4. Doporuč případné úpravy (RR, SL, atd.)
5. Shrň confluence body a jejich vliv na výsledek

Odpověz v češtině, strukturovaně a prakticky. Na začátku napiš kolik podobných obchodů jsi našel a jejich success rate.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ 
      output: text,
      stats: {
        totalTrades: historicalTrades.length,
        analysisPerformed: true
      }
    });
  } catch (error) {
    console.error("Chyba při analýze:", error);
    return NextResponse.json({ error: "Chyba při komunikaci s Gemini" }, { status: 500 });
  }
}
