"use client";

import { useState } from "react";

interface QueryResult {
  response: string;
  stats: {
    totalTrades: number;
    processedTrades: number;
  };
}

export default function TradeChat() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();

      if (data.response) {
        setResult({
          response: data.response,
          stats: data.stats,
        });
      }
    } catch (error) {
      console.error("Chyba při dotazu:", error);
      setResult({
        response: "Došlo k chybě. Zkuste to prosím znovu.",
        stats: { totalTrades: 0, processedTrades: 0 },
      });
    } finally {
      setLoading(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setQuestion("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Query Form */}
        <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              🤖 Zeptej se AI asistenta
            </h2>
            {result && (
              <button
                onClick={clearResult}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-300 rounded transition-colors"
              >
                Vymazat
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tvoje otázka o trading datech
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Například: Jaký mám success rate u Long pozic? Které confluences fungují nejlépe? Kolik jsem vydělal v NY session?"
                rows={4}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loading ? "🔄 Analyzuji databázi..." : "🔍 Zeptat se"}
            </button>
          </form>

          {/* Příklady otázek */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              💡 Příklady otázek:
            </h4>
            <div className="text-xs text-blue-700 space-y-1">
              <div>• "Jaký mám celkový success rate?"</div>
              <div>• "Které confluences mají nejlepší výsledky?"</div>
              <div>• "Kolik jsem vydělal/ztratil tento měsíc?"</div>
              <div>• "Jaké jsou mé nejčastější chyby?"</div>
              <div>• "Která session je pro mě nejziskovější?"</div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800">📊 Odpověď AI</h3>
            {result && (
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                📈 {result.stats.processedTrades}/{result.stats.totalTrades}{" "}
                obchodů
              </div>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">
                Analyzuji tvoje trading data...
              </span>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <div className="text-sm text-green-700">
                  ✅ Analýza dokončena na základě{" "}
                  <strong>{result.stats.totalTrades}</strong> obchodů
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                  {result.response}
                </div>
              </div>
            </div>
          )}

          {!result && !loading && (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-3">🤖</div>
              <p className="text-lg font-medium mb-2">Zeptej se na cokoliv!</p>
              <p className="text-sm">
                AI má přístup ke všem tvým trading datům a může odpovědět na
                jakoukoliv otázku
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
