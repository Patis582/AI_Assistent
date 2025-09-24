"use client";

import TradeForm from "./components/TradeForm";

export default function NotionPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Trading Journal Assistant</h1>
      <p className="text-gray-600 mb-6">
        Zadejte parametry obchodu pro analýzu na základě historických dat z
        Notion
      </p>
      <TradeForm />
    </div>
  );
}
