
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, RetailerSource } from "../types";

// Constant for Monetization: Your Affiliate Tag
// Ensure it doesn't break original URLs by being careful with query parameters
const AFFILIATE_TAG = "ref=price_guardian_pro_2025";

export async function analyzeProduct(
  imageBytes?: string,
  productQuery?: string,
  location?: { latitude: number; longitude: number }
): Promise<AnalysisResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  
  const isUrl = productQuery?.trim().startsWith('http');

  const systemInstruction = `
    You are 'AI Price Guardian Pro' - the world's most accurate shopping intelligence system for Bangladesh.
    Your goal is 100% data accuracy. 

    CRITICAL INSTRUCTIONS TO PREVENT 404 ERRORS:
    1. NO HALLUCINATION: DO NOT predict or "guess" what a product URL might be.
    2. VERIFIED LINKS ONLY: Only return URLs (URIs) that you have explicitly found in the search grounding results for today.
    3. TECH MARVELS PRIORITY: For tech/laptops, specifically look for listings on 'techmarvels.com.bd'. If found, it MUST be the first source.
    4. BENGALI ADVICE: Provide deep insight in Bengali. If Tech Marvels is suggested, explain that they are chosen for verified warranty and competitive local pricing.
    5. DATA FRESHNESS: Use real-time search to find the absolute current price.

    STRICT JSON OUTPUT FORMAT (NO MARKDOWN, NO EXTRA TEXT):
    {
      "productName": "string",
      "category": "Electronics" | "Groceries" | "Fashion" | "Home" | "Other",
      "currentFoundPrice": "string (৳ format)",
      "marketAverage": "string (৳ format)",
      "verdict": "BUY_NOW" | "WAIT" | "CAUTION",
      "advice": "Detailed Bengali advice explaining the choice of stores and pricing trends.",
      "bestBuyLink": "VERIFIED_URL",
      "productImageUrl": "VERIFIED_IMAGE_URL",
      "priceHistory": [{"month": "MonthName", "price": number}],
      "sources": [
        {
          "title": "Store Name",
          "uri": "VERIFIED_LIVE_URL",
          "trustScore": 1-5,
          "deliveryCharge": "৳ amount",
          "isFeatured": boolean
        }
      ]
    }

    LOCATION CONTEXT: ${location ? `Latitude: ${location.latitude}, Longitude: ${location.longitude}` : 'Unknown'}.
  `;

  const contents = [];
  if (imageBytes) {
    contents.push({
      parts: [
        { inlineData: { data: imageBytes, mimeType: "image/jpeg" } },
        { text: "Precisely identify this product. Perform a live Google Search to find current prices in Bangladesh. Prioritize techmarvels.com.bd if it is an electronic item." }
      ]
    });
  } else {
    const promptText = isUrl 
      ? `Verify this specific link: ${productQuery}. Check if the price is currently valid and find at least 2 other BD retailers for comparison.`
      : `Search for the current exact price of '${productQuery}' across Bangladesh. Priority search: techmarvels.com.bd. Also check Star Tech and Ryans. Ensure all returned links are active and correct.`;
    
    contents.push({
      parts: [{ text: promptText }]
    });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }]
      },
    });

    let rawJson = response.text || "{}";
    let result: Partial<AnalysisResult> = {};
    
    try {
      // Robust JSON cleaning
      const cleanJson = rawJson.replace(/```json|```/g, "").trim();
      result = JSON.parse(cleanJson);
    } catch (e) {
      const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) result = JSON.parse(jsonMatch[0]);
    }

    // Improved Affiliate Link Application (Prevents breaking URLs)
    const applyAffiliate = (url?: string) => {
      if (!url || !url.startsWith('http')) return url;
      try {
        const urlObj = new URL(url);
        urlObj.searchParams.set('utm_source', 'price_guardian');
        urlObj.searchParams.set('aff_id', 'gp_2025');
        // Only add custom tag if it's not already there
        if (!urlObj.searchParams.has('ref')) {
          urlObj.searchParams.set('ref', AFFILIATE_TAG);
        }
        return urlObj.toString();
      } catch (e) {
        return url; // Return original if URL parsing fails
      }
    };

    const rawSources = (result.sources || []).map((s: RetailerSource) => ({
      ...s,
      uri: applyAffiliate(s.uri) || ''
    }));

    // Organic Sorting: Tech Marvels always first if available
    const processedSources = rawSources.sort((a, b) => {
      const aIsTM = a.uri?.toLowerCase().includes('techmarvels.com.bd') || a.title?.toLowerCase().includes('tech marvel');
      const bIsTM = b.uri?.toLowerCase().includes('techmarvels.com.bd') || b.title?.toLowerCase().includes('tech marvel');
      if (aIsTM && !bIsTM) return -1;
      if (!aIsTM && bIsTM) return 1;
      return 0;
    });

    // Validation to prevent bad output states
    if (!result.productName || (processedSources.length === 0 && !result.bestBuyLink)) {
       throw new Error("Targeted search returned insufficient data.");
    }

    return {
      productName: result.productName || "পণ্য পাওয়া গেছে",
      category: result.category || 'Other',
      currentFoundPrice: result.currentFoundPrice || "N/A",
      marketAverage: result.marketAverage || "N/A",
      verdict: result.verdict || "CAUTION",
      advice: result.advice || "বাজার যাচাই করে কেনা বুদ্ধিমানের কাজ হবে।",
      priceHistory: result.priceHistory || [],
      bestBuyLink: applyAffiliate(result.bestBuyLink),
      productImageUrl: result.productImageUrl,
      sources: processedSources
    };
  } catch (apiError) {
    console.error("Accuracy Engine Failure:", apiError);
    throw apiError;
  }
}
