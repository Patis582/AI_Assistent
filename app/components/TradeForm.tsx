"use client";

import { useState } from "react";

export default function TradeForm() {
  const [position, setPosition] = useState("");
  const [session, setSession] = useState("New York");
  const [confluences, setConfluences] = useState<string[]>([]);
  const [orderType, setOrderType] = useState("limit");
  const [sl, setSl] = useState("");
  const [rr, setRr] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tradeInput = {
      position,
      session,
      confluences,
      orderType,
      sl: Number(sl),
      rr: Number(rr),
    };

    console.log("New trade input:", tradeInput);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md mx-auto p-4 bg-white shadow rounded space-y-4"
    >
      <h2 className="text-lg font-bold">Zadej nový obchod</h2>

      <div>
        <label className="block text-sm font-medium">Position</label>
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="">Select position</option>
          <option value="Long">Long</option>
          <option value="Short">Short</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Session</label>
        <select
          value={session}
          onChange={(e) => setSession(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="London">London</option>
          <option value="New York">New York</option>
          <option value="Asia">Asia</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">RR</label>
        <input
          type="number"
          step="0.1"
          value={rr}
          onChange={(e) => setRr(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Confluences</label>
        <select
          multiple
          value={confluences}
          onChange={(e) =>
            setConfluences(
              Array.from(e.target.selectedOptions, (option) => option.value)
            )
          }
          className="w-full border p-2 rounded h-24"
        >
          <option value="H4 trend">H4 trend</option>
          <option value="H4 break/odraz">H4 break/odraz</option>
          <option value="Pattern break">Pattern break</option>
          <option value="m30/H1 break/odraz">m30/H1 break/odraz</option>
          <option value="Nedodělaný wick">Nedodělaný wick</option>
          <option value="Svíčková formace">Svíčková formace</option>

        </select>
        <p className="text-xs text-gray-500">
          Hold Ctrl/Cmd to select multiple
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium">Order Type</label>
        <select
          value={orderType}
          onChange={(e) => setOrderType(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="limit">Limit</option>
          <option value="market">Market</option>
          <option value="stop">Stop</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">SL (pips)</label>
        <input
          type="number"
          value={sl}
          onChange={(e) => setSl(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        Vyhodnotit obchod
      </button>
    </form>
  );
}
