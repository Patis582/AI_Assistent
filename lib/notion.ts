import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// Typy
export interface NotionPage {
  id: string;
  properties: Record<string, unknown>;
}

export interface NotionProperty {
  type: string;
  title?: Array<{ plain_text: string }>;
  select?: { name: string };
  number?: number;
  date?: { start: string };
  formula?: { string: string };
  relation?: Array<{ id: string }>;
  rich_text?: Array<{ plain_text: string }>;
}

export interface Trade {
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
  notes: string;
}

// Sdílené funkce
export async function getPageTitle(pageId: string): Promise<string> {
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

export async function getRelationTitles(relations: Array<{ id: string }>): Promise<string[]> {
  if (!relations?.length) return [];
  return Promise.all(relations.map(r => getPageTitle(r.id)));
}

export async function getHistoricalTrades(): Promise<Trade[]> {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
    });

    const trades = await Promise.all(
      response.results.map(async (page: unknown) => {
        const notionPage = page as NotionPage;
        const p = notionPage.properties;
        
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
          notes: getProp("Notes")?.rich_text?.[0]?.plain_text || ""
        };
      })
    );

    return trades;
  } catch (error) {
    console.error("Chyba při načítání dat z Notion:", error);
    return [];
  }
}