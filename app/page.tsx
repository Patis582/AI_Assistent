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

      {/* Simple table for testing */}
      <table className="border">
        <thead>
          <tr>
            <th className="border p-1">Position</th>
            <th className="border p-1">Session</th>
            <th className="border p-1">RR</th>
            <th className="border p-1">Outcome</th>
            <th className="border p-1">Confluences</th>
            <th className="border p-1">Order Type</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 5).map((trade) => (
            <tr key={trade.id}>
              <td className="border p-1">{trade.position}</td>
              <td className="border p-1">{trade.session}</td>
              <td className="border p-1">{trade.rr}</td>
              <td className="border p-1">{trade.outcome}</td>
              <td className="border p-1">{trade.confluences.join(", ")}</td>
              <td className="border p-1">{trade.order_type.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Raw data dump for debugging */}
      <pre className="bg-gray-100 p-2 mt-4 text-xs overflow-auto">
        {JSON.stringify(data[0], null, 2)}
      </pre>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Trading Journal Assistant</h1>
        <TradeForm />
      </div>
    </div>
  );
}
