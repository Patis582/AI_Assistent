"use client";

import TradeForm from "./components/TradeForm";

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
        <TradeForm />
      </div>

      {/* Simple Footer */}
      <div className="text-center py-6 text-sm text-gray-500">
        <p>Moje vlastní AI analýza • Gemini + Notion</p>
      </div>
    </div>
  );
}
