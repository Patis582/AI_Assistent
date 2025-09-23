"use client";

import { useEffect, useState } from "react";
import { Trade } from "./api/notion/route";

export default function NotionPage() {
  const [data, setData] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/notion");
        const json = await res.json();

        console.log("API Response:", json);

        if (Array.isArray(json)) {
          setData(json);
        } else if (json.error) {
          setError(json.error);
        } else {
          setError("Neočekávaný formát dat z API");
        }
      } catch (err) {
        setError("Chyba při načítání dat");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p>Načítám data z Notion…</p>;
  if (error) return <p className="text-red-500">Chyba: {error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Trading Journal (Notion)</h1>
      {data.length === 0 ? (
        <p>Žádná data nenalezena</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="border-collapse border border-gray-300 w-full">
            <thead>
              <tr>
                <th className="border p-2">Position</th>
                <th className="border p-2">Date</th>
                <th className="border p-2">RR</th>
                <th className="border p-2">Outcome</th>
                <th className="border p-2">Confluences</th>
                <th className="border p-2">Order Type</th>
                <th className="border p-2">S/L Pips</th>
                <th className="border p-2">Risk %</th>
                <th className="border p-2">PnL</th>
              </tr>
            </thead>
            <tbody>
              {data.map((trade) => (
                <tr key={trade.id}>
                  <td className="border p-2">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        trade.position === "Long"
                          ? "bg-green-100 text-green-800"
                          : trade.position === "Short"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100"
                      }`}
                    >
                      {trade.position || "No position"}
                    </span>
                  </td>
                  <td className="border p-2">
                    {trade.date
                      ? new Date(trade.date).toLocaleDateString()
                      : "No date"}
                  </td>
                  <td className="border p-2 text-center">
                    <span
                      className={`font-mono ${
                        (trade.rr ?? 0) > 0
                          ? "text-green-600"
                          : (trade.rr ?? 0) < 0
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {trade.rr !== null ? trade.rr.toFixed(2) : "N/A"}
                    </span>
                  </td>
                  <td className="border p-2">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        trade.outcome?.includes("Win") ||
                        trade.outcome?.includes("🟢")
                          ? "bg-green-100 text-green-800"
                          : trade.outcome?.includes("Loss") ||
                            trade.outcome?.includes("🔴")
                          ? "bg-red-100 text-red-800"
                          : trade.outcome?.includes("Protected") ||
                            trade.outcome?.includes("🔵")
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100"
                      }`}
                    >
                      {trade.outcome || "Unknown"}
                    </span>
                  </td>
                  <td className="border p-2">
                    {trade.confluences.length > 0 ? (
                      <div className="space-y-1">
                        {trade.confluences.map((confluence, index) => (
                          <div
                            key={index}
                            className="text-xs bg-blue-50 px-2 py-1 rounded"
                          >
                            {confluence}
                          </div>
                        ))}
                      </div>
                    ) : (
                      "No confluences"
                    )}
                  </td>
                  <td className="border p-2">
                    {trade.order_type.length > 0 ? (
                      <div className="space-y-1">
                        {trade.order_type.map((orderType, index) => (
                          <div
                            key={index}
                            className="text-xs bg-purple-50 px-2 py-1 rounded"
                          >
                            {orderType}
                          </div>
                        ))}
                      </div>
                    ) : (
                      "No order type"
                    )}
                  </td>
                  <td className="border p-2 text-center font-mono">
                    {trade.sl !== null ? `${trade.sl}` : "N/A"}
                  </td>
                  <td className="border p-2 text-center font-mono">
                    {trade.risk !== null ? `${trade.risk}%` : "N/A"}
                  </td>
                  <td className="border p-2 text-center font-mono">
                    <span
                      className={`${
                        (trade.pnl ?? 0) > 0
                          ? "text-green-600"
                          : (trade.pnl ?? 0) < 0
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {trade.pnl !== null ? `$${trade.pnl.toFixed(2)}` : "N/A"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
