// src/services/recipeService.ts
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase"; // 請確認指向你的 firebase 初始化實例

export interface RecipeData {
  name: string;
  role: "one_pot" | "meat" | "veg_meat" | "veg_only" | "soup" | string;
  cookware: "pan" | "pot" | "cooker" | "airfryer" | "oven" | "microwave" | string;
  primaryVeg: string;
  ingredients: string;
  steps: string;
  note: string;
  isFav?: boolean;
}

export async function parseAndSaveRecipe(rawText: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("請先在 .env 設定 VITE_GEMINI_API_KEY");
  }

  const prompt = `請將以下食譜內容整理並輸出為標準 JSON，不要輸出任何 Markdown 標記（如 \`\`\`json ），只輸出純 JSON 字串：

食譜內容：
${rawText}

輸出規格：
{"name":"菜名","role":"one_pot 或 meat 或 veg_meat 或 veg_only 或 soup","cookware":"pan 或 pot 或 cooker 或 airfryer 或 oven 或 microwave","primaryVeg":"使用的主要蔬菜名，若無則留空字串","ingredients":"主要食材與調味份量","steps":"做法步驟","note":"備註說明，若無則留空字串"}`;

  // 1. 呼叫 Gemini 3.8 Flash (若過載可換 gemini-2.5-flash)
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `API 請求失敗 (${response.status})`);
  }

  const result = await response.json();
  const rawJsonString = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawJsonString) {
    throw new Error("無法從 Gemini 取得有效的食譜內容");
  }

  // 2. 清理潛在的 Markdown 標記並轉成物件
  const cleanJson = rawJsonString.replace(/```json|```/g, "").trim();
  const parsedData: RecipeData = JSON.parse(cleanJson);

  // 3. 寫入 Firestore
  const docRef = await addDoc(collection(db, "recipes"), {
    ...parsedData,
    isFav: true,
    createdAt: serverTimestamp()
  });

  return docRef.id;
}