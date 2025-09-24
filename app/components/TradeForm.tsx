"use client";

import { useState } from "react";

export default function TradeForm() {
  const [position, setPosition] = useState("");
  const [session, setSession] = useState("New York");
  const [confluences, setConfluences] = useState<string[]>([]);
  const [orderType, setOrderType] = useState("limit");
  const [sl, setSl] = useState("");
  const [rr, setRr] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const tradeInput = {
      position,
      session,
      confluences,
      orderType,
      sl: Number(sl),
      rr: Number(rr),
    };

    console.log("New trade input:", tradeInput);

    try {
      const response = await fetch("/api/analyzeTrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tradeInput),
      });

      const result = await response.json();

      if (result.error) {
        setAnalysis(`Chyba: ${result.error}`);
      } else {
        setAnalysis(result.output);
      }
    } catch (error) {
      console.error("Chyba při analýze:", error);
      setAnalysis("Došlo k chybě při analýze obchodu. Zkuste to znovu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulář */}
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-lg p-6 space-y-4"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Zadej nový obchod
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position *
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select position</option>
              <option value="Long">Long</option>
              <option value="Short">Short</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session
            </label>
            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="London">London</option>
              <option value="New York">New York</option>
              <option value="Asia">Asia</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RR *
            </label>
            <input
              type="number"
              step="0.1"
              value={rr}
              onChange={(e) => setRr(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="např. 2.5"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confluences *
            </label>
            <select
              multiple
              value={confluences}
              onChange={(e) =>
                setConfluences(
                  Array.from(e.target.selectedOptions, (option) => option.value)
                )
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="H4 trend">H4 trend</option>
              <option value="H4 break/odraz">H4 break/odraz</option>
              <option value="Pattern break">Pattern break</option>
              <option value="m30/H1 break/odraz">m30/H1 break/odraz</option>
              <option value="Nedodělaný wick">Nedodělaný wick</option>
              <option value="Svíčková formace">Svíčková formace</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Hold Ctrl/Cmd to select multiple
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Type
            </label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="limit">Limit</option>
              <option value="market">Market</option>
              <option value="stop">Stop</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SL (pips) *
            </label>
            <input
              type="number"
              value={sl}
              onChange={(e) => setSl(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="např. 20"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || confluences.length === 0}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? "🔄 Analyzuji..." : "📊 Vyhodnotit obchod"}
          </button>
        </form>

        {/* Výsledky */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            📈 Analýza obchodu
          </h3>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                Načítám historická data a analyzuji...
              </span>
            </div>
          )}

          {analysis && !loading && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {analysis}
              </div>
            </div>
          )}

          {!analysis && !loading && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📝</div>
              <p>Vyplňte formulář pro získání analýzy obchodu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
