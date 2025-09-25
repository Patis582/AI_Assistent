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
  mistakes: string[];
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
          mistakes: await getRelationTitles(getProp("Mistakes")?.relation || []),
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
   - Chyby ${trade.mistakes}
`).join("")}

ÚKOLY:
1) Najdi v historických datech obchody podobné novému (pozice, confluences, session, Order Type, SL pips, RR). 
   - Největší váhu dávej shodě confluences jako celku (ne jen jedné). 
   - Pokud se neshodují všechny, pracuj s podobností: více shod = vyšší váha. 
   - Menší váhu pak dej session, SL, RR a Order Type. 
   - U každého faktoru zohledni více metrik, ne jen jednu.

2) Spočítej success rate těchto podobných obchodů a napiš přesně, kolik jich bylo.

3) Vyhodnoť šanci na úspěch nového obchodu na základě podobností (uveď, které faktory hrají pro/ proti).

4) Uveď konkrétní doporučení pro vstup, RR a SL.

5) Spočítej průměrný PnL těchto obchodů.

6) Doporuč případné úpravy (RR, SL atd.), pokud by zlepšily pravděpodobnost úspěchu.

7) Shrň confluence body a jejich vliv na výsledek (pozitivní / negativní).

8) Podívej se na chyby z podobných obchodů a upozorni na ně.

FORMÁT:
- Na první řádek: Success rate: X%
- Na druhý řádek: Podobné obchody: Y
- Pak vynech jeden řádek.
- Všechny úkoly shrň maximálně do 10 vět.

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
