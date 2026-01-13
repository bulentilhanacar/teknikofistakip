"use server";

import { generateRiskAnalysis, GenerateRiskAnalysisInput, GenerateRiskAnalysisOutput } from "@/ai/flows/generate-risk-analysis";

export async function performRiskAnalysis(input: GenerateRiskAnalysisInput): Promise<{ data: GenerateRiskAnalysisOutput | null, error: string | null }> {
  try {
    const result = await generateRiskAnalysis(input);
    return { data: result, error: null };
  } catch (error) {
    console.error("Risk analysis failed:", error);
    return { data: null, error: "Risk analizi sırasında bir hata oluştu. Lütfen tekrar deneyin." };
  }
}
