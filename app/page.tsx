"use client";

import { useEffect, useState } from "react";
import { Trade } from "./api/notion/route";
import TradeForm from "./components/TradeForm";

export default function NotionPage() {
  const [data, setData] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notion")
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json)) {
          setData(json);
          console.log("Loaded trades:", json); // Debug
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-4">
      <h1>Trading Journal</h1>
      <p>Loaded {data.length} trades</p>

    
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Trading Journal Assistant</h1>
        <TradeForm />
      </div>
    </div>
  );
}
