// src/AiImportModal.jsx
import React, { useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import { parseAndSaveRecipe } from "../recipeService";

export default function AiImportModal({ isOpen, onClose }) {
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setErrorMsg("");

    try {
      await parseAndSaveRecipe(inputText);
      setInputText("");
      onClose(); // 儲存成功自動關閉彈窗
    } catch (err) {
      setErrorMsg(err.message || "解析失敗，請稍後再試！");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-2xl space-y-3">
        <div className="flex justify-between items-center border-b pb-2">
          <div className="flex items-center space-x-1.5 text-emerald-800 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>AI 貼文快速解析食譜</span>
          </div>
          <button 
            onClick={onClose} 
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 font-bold p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          直接貼上 Threads、IG 或網頁複製的整段食譜文字，AI 會自動分類、擷取材料步驟並存入資料庫：
        </p>

        <textarea
          rows={6}
          placeholder="例如：\n【日式馬鈴薯燉肉】\n材料：馬鈴薯2顆、牛肉片...\n步驟：1. 洋蔥炒軟..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoading}
          className="w-full border rounded-xl p-2.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none disabled:bg-slate-50"
        />

        {errorMsg && (
          <p className="text-xs text-rose-500 font-medium bg-rose-50 p-2 rounded-lg">
            {errorMsg}
          </p>
        )}

        <div className="flex space-x-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 bg-slate-100 text-slate-600 font-semibold py-2 rounded-lg text-xs"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isLoading || !inputText.trim()}
            className="flex-1 bg-emerald-600 text-white font-semibold py-2 rounded-lg text-xs hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center space-x-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>AI 解析中...</span>
              </>
            ) : (
              <span>開始解析存入</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}