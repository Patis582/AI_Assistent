/*
import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export interface Trade {
  id: string;
  position: string;
  date: string;
  rr: number | null;
  outcome: string;
  confluences: string[];
  sl: number | null;
  risk: number | null;
  pnl: number | null;
  order_type: string[];
  session: string[];
}

// Helper to get page title
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

// Helper to get relation titles
async function getRelationTitles(relations: any[]): Promise<string[]> {
  if (!relations?.length) return [];
  return Promise.all(relations.map(r => getPageTitle(r.id)));
}

async function mapPageToTrade(page: any): Promise<Trade> {
  const p = page.properties;
  
  return {
    id: page.id,
    position: p.Position?.select?.name || "",
    date: p["Entry / Exit Date"]?.date?.start || "",
    rr: p["Actual RR achieved: W(+1), L(-1), BE(0)"]?.number ?? null,
    outcome: p.Outcome?.formula?.string || "",
    sl: p["S/L Pips"]?.number ?? null,
    risk: p["% Risk"]?.number ?? null,
    pnl: p["Gross PnL"]?.number ?? null,
    confluences: await getRelationTitles(p.Confluences?.relation || []),
    order_type: await getRelationTitles(p["Order Type"]?.relation || []),
    session: await getRelationTitles(p["Session"]?.relation || [])
  };
}

export async function GET() {
  try {
    const response = await (notion as any).databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
    });

    const trades = await Promise.all(
      response.results.map(mapPageToTrade)
    );

    return NextResponse.json(trades);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
*/