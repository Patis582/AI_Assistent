"use client";

import { useState } from "react";

interface AnalysisResult {
  output: string;
  stats: {
    totalTrades: number;
    analysisPerformed: boolean;
  };
}

export default function TradeForm() {
  const [position, setPosition] = useState("");
  const [session, setSession] = useState("New York");
  const [confluences, setConfluences] = useState<string[]>([]);
  const [orderType, setOrderType] = useState("limit");
  const [sl, setSl] = useState("");
  const [rr, setRr] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const confulencesList = [
    "Pattern 5m/15m",
    "Pattern 30m/H1",
    "Break 30m/H1 low/high",
    "Odraz 30m/H1 low/high",
    "Odraz/break H4 SR",
    "H4 trend",
    "Trendline break",
    "Svíčkové formace 30m/H1",
    "Svíčkové formace H4",
    "Nedodělaný wick",
    "Potvrzení",
  ];

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
        setAnalysis(null);
      } else {
        setAnalysis(result);
      }
    } catch (error) {
      console.error("Chyba při analýze:", error);
      setAnalysis(null);
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confluences *
            </label>

            <div className="border border-gray-300 rounded-md p-3 bg-white max-h-48 overflow-y-auto">
              <div className="grid grid-cols-2 gap-x-4">
                {confulencesList.map((confluence) => (
                  <label
                    key={confluence}
                    className="flex items-center space-x-2 p-1 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={confluences.includes(confluence)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setConfluences([...confluences, confluence]);
                        } else {
                          setConfluences(
                            confluences.filter((c) => c !== confluence)
                          );
                        }
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 flex-shrink-0"
                    />
                    <span className="text-sm text-gray-700 select-none">
                      {confluence}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              {confluences.length} z {confulencesList.length} vybráno
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">
              📈 Analýza obchodu
            </h3>
            {analysis && (
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                📊 {analysis.stats.totalTrades} obchodů v databázi
              </div>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                Načítám historická data a analyzuji...
              </span>
            </div>
          )}

          {analysis && !loading && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="text-sm text-blue-700">
                  ✅ Analyzováno na základě{" "}
                  <strong>{analysis.stats.totalTrades}</strong> historických
                  obchodů
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {analysis.output}
                </div>
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
