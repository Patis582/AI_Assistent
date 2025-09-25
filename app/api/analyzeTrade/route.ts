import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getHistoricalTrades } from "@/lib/notion";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(req: Request) {
  try {
    const newTrade = await req.json();
    const historicalTrades = await getHistoricalTrades();
    
    const prompt = `
NOVÝ OBCHOD K ANALÝZE:
- Pozice: ${newTrade.position}
- Session: ${newTrade.session}
- Plánované RR: ${newTrade.rr}
- Confluences: ${newTrade.confluences.join(", ")}
- Order Type: ${newTrade.orderType}
- Stop Loss: ${newTrade.sl} pips
- Poznámky k obchodu ${newTrade.notes}

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
   -Poznámky k obchodu ${trade.notes}
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
- Všechny úkoly přehledně shrň do 10 vět.

    `;

    const result = await model.generateContent(prompt);
    return NextResponse.json({ 
      output: result.response.text(),
      stats: { totalTrades: historicalTrades.length, analysisPerformed: true }
    });
  } catch (error) {
    console.error("Chyba při analýze:", error); // Přidáno pro podrobnější sledování chyb
    return NextResponse.json({ error: "Chyba při analýze" }, { status: 500 });
  }
}

// GET pro confluences
export async function GET() {
  try {
    const trades = await getHistoricalTrades();
    const confluences = [...new Set(
      trades.flatMap(trade => trade.confluences.filter(c => c !== 'Unknown'))
    )].sort();
    
    return NextResponse.json(confluences);
  } catch (error) {
    console.error("Chyba při načítání confluences:", error); // Přidáno pro podrobnější sledování chyb
    return NextResponse.json([], { status: 500 });
  }
}
