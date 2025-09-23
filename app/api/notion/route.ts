import { NextResponse } from "next/server";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// Types
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
}

// Helper function to map Notion page to Trade object
async function mapPageToTrade(page: any, notionClient: Client): Promise<Trade> {
  const props = page.properties;
  
  // Extract basic properties
  const id = page.id;
  const position = props.Position?.select?.name || "";
  const date = props["Entry / Exit Date"]?.date?.start || "";  // Použijte správný název
  const rr = props["Actual RR achieved: W(+1), L(-1), BE(0)"]?.number ?? null;  // Použijte správný název
  const outcome = props.Outcome?.formula?.string || "";
  const sl = props["S/L Pips"]?.number || null;  // Použijte správný název
  const risk = props["% Risk"]?.number || null;  // Použijte správný název
  const pnl = props["Gross PnL"]?.number || null;  // Použijte správný název
  
  // Extract Order Type - relation field s debug informacemi
  const order_type: string[] = [];
  const orderTypeRelations = props["Order Type"]?.relation || [];  // Použijte správný název
  
  console.log("Order Type property:", props["Order Type"]);
  console.log("Order Type relations:", orderTypeRelations);
  
  if (orderTypeRelations.length > 0) {
    const orderTypePromises = orderTypeRelations.map(async (relation: any) => {
      try {
        console.log("Fetching order type page:", relation.id);
        const orderTypePage = await notionClient.pages.retrieve({
          page_id: relation.id
        });
        console.log("Order type page properties:", (orderTypePage as any).properties);
        
        const orderTypeProps = (orderTypePage as any).properties;
        
        // Zkusíme různé možnosti pro název
        const name = orderTypeProps.Name?.title?.[0]?.plain_text || 
                    orderTypeProps.title?.title?.[0]?.plain_text ||
                    orderTypeProps.Title?.title?.[0]?.plain_text ||
                    Object.values(orderTypeProps).find((prop: any) => prop.type === 'title')?.title?.[0]?.plain_text ||
                    "Unknown Order Type";
        
        console.log("Found order type name:", name);
        return name;
      } catch (error) {
        console.error(`Error fetching order type ${relation.id}:`, error);
        return "Error Order Type";
      }
    });
    
    const orderTypeNames = await Promise.all(orderTypePromises);
    order_type.push(...orderTypeNames);
  }
  
  // Extract confluences - fetch names from related pages
  const confluences: string[] = [];
  const confluenceRelations = props.Confluences?.relation || [];
  
  if (confluenceRelations.length > 0) {
    const confluencePromises = confluenceRelations.map(async (relation: any) => {
      try {
        const confluencePage = await notionClient.pages.retrieve({
          page_id: relation.id
        });
        const confluenceProps = (confluencePage as any).properties;
        return confluenceProps.Name?.title?.[0]?.plain_text || 
               confluenceProps.title?.title?.[0]?.plain_text ||
               Object.values(confluenceProps).find((prop: any) => prop.type === 'title')?.title?.[0]?.plain_text ||
               "Unnamed Confluence";
      } catch (error) {
        console.error(`Error fetching confluence ${relation.id}:`, error);
        return "Unknown Confluence";
      }
    });
    
    const confluenceNames = await Promise.all(confluencePromises);
    confluences.push(...confluenceNames);
  }
  
  return {
    id,
    position,
    date,
    rr,
    outcome,
    confluences,
    sl,
    risk,
    pnl,
    order_type
  };
}

// Updated API route with clean data mapping
export async function GET() {
  try {
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID!,
    });

    // Map all pages to clean Trade objects
    const trades: Trade[] = await Promise.all(
      response.results.map(page => mapPageToTrade(page, notion))
    );

    return NextResponse.json(trades);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
