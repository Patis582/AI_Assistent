import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Client } from "@notionhq/client";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
const notion = new Client({ auth: process.env.NOTION_TOKEN });

// Typy pro Notion API response
interface NotionPage {
  id: string;
  properties: Record<string, unknown>;
}

interface NotionProperty {
  type: string;
  title?: Array<{ plain_text: string }>;
  select?: { name: string };
  number?: number;
  date?: { start: string };
  formula?: { string: string };
  relation?: Array<{ id: string }>;
}

interface Trade {
  id: string;
  position: string;
  date: string;
  rr: number | null;
  outcome: string;
  confluences: string[];
  order_type: string[];
  session: string[];
  sl: number | null;
  risk: number | null;
  pnl: number | null;
}

// Helper functions s typováním
async function getPageTitle(pageId: string): Promise<string> {
  try {
    const page = await notion.pages.retrieve({ page_id: pageId }) as NotionPage;
    const props = page.properties;
    const titleProp = Object.values(props).find((prop: unknown) => {
      const p = prop as NotionProperty;
      return p.type === 'title';
    }) as NotionProperty | undefined;
    return titleProp?.title?.[0]?.plain_text || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

async function getRelationTitles(relations: Array<{ id: string }>): Promise<string[]> {
  if (!relations?.length) return [];
  return Promise.all(relations.map(r => getPageTitle(r.id)));
}

async function getHistoricalTrades(): Promise<Trade[]> {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
    });

    const trades = await Promise.all(
      response.results.map(async (page: unknown) => {
        const notionPage = page as NotionPage;
        const p = notionPage.properties;
        
        // Helper pro bezpečné získání property
        const getProp = (key: string): NotionProperty | undefined => {
          return p[key] as NotionProperty | undefined;
        };

        return {
          id: notionPage.id,
          position: getProp("Position")?.select?.name || "",
          date: getProp("Entry / Exit Date")?.date?.start || "",
          rr: getProp("Actual RR achieved: W(+1), L(-1), BE(0)")?.number ?? null,
          outcome: getProp("Outcome")?.formula?.string || "",
          confluences: await getRelationTitles(getProp("Confluences")?.relation || []),
          order_type: await getRelationTitles(getProp("Order Type")?.relation || []),
          session: await getRelationTitles(getProp("Session")?.relation || []),
          sl: getProp("S/L Pips")?.number ?? null,
          risk: getProp("% Risk")?.number ?? null,
          pnl: getProp("Gross PnL")?.number ?? null,
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
    const newTrade = await req.json() as {
      position: string;
      session: string;
      rr: number;
      confluences: string[];
      orderType: string;
      sl: number;
    };
    
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
