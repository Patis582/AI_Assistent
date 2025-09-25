"use client";

import TradeForm from "./components/TradeForm";
import TradeChat from "./components/TradeChat";

export default function NotionPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎯 Trading Assistant
            </h1>
            <p className="text-gray-600">
              Analýza obchodů na základě historických dat
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Trading Form */}
          <TradeForm />

          {/* Chat Assistant */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Zeptej se AI na cokoliv o svých obchodech
            </h2>
            <TradeChat />
          </div>
        </div>
      </div>

      {/* Simple Footer */}
      <div className="text-center py-6 text-sm text-gray-500">
        <p>AI analýza • Gemini + Notion</p>
      </div>
    </div>
  );
}
