'use server';

/**
 * @fileOverview Generates a risk analysis for a construction project using AI.
 *
 * - generateRiskAnalysis - A function that generates the risk analysis.
 * - GenerateRiskAnalysisInput - The input type for the generateRiskAnalysis function.
 * - GenerateRiskAnalysisOutput - The return type for the generateRiskAnalysis function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRiskAnalysisInputSchema = z.object({
  projectDescription: z
    .string()
    .describe('A detailed description of the construction project.'),
  projectTimeline: z
    .string()
    .describe('The timeline of the construction project.'),
  budgetDetails: z.string().describe('The budget details for the project.'),
  locationInfo: z.string().describe('Information about the project location.'),
  contractTerms: z.string().describe('Key contract terms and conditions.'),
});

export type GenerateRiskAnalysisInput = z.infer<typeof GenerateRiskAnalysisInputSchema>;

const GenerateRiskAnalysisOutputSchema = z.object({
  identifiedRisks: z
    .string()
    .describe('A list of identified risks for the project.'),
  mitigationStrategies: z
    .string()
    .describe('Recommended mitigation strategies for each identified risk.'),
  overallRiskAssessment: z
    .string()
    .describe('An overall assessment of the project risk level.'),
});

export type GenerateRiskAnalysisOutput = z.infer<typeof GenerateRiskAnalysisOutputSchema>;

export async function generateRiskAnalysis(
  input: GenerateRiskAnalysisInput
): Promise<GenerateRiskAnalysisOutput> {
  return generateRiskAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRiskAnalysisPrompt',
  input: {schema: GenerateRiskAnalysisInputSchema},
  output: {schema: GenerateRiskAnalysisOutputSchema},
  prompt: `You are an AI assistant that analyzes construction project risks.

  Analyze the following project details to identify potential risks, suggest mitigation strategies, and provide an overall risk assessment.

  Project Description: {{{projectDescription}}}
  Project Timeline: {{{projectTimeline}}}
  Budget Details: {{{budgetDetails}}}
  Location Information: {{{locationInfo}}}
  Contract Terms: {{{contractTerms}}}

  Provide the identified risks, mitigation strategies, and overall risk assessment in a clear and concise manner.

  Output:
  Identified Risks: <risks>
  Mitigation Strategies: <strategies>
  Overall Risk Assessment: <assessment>`,
});

const generateRiskAnalysisFlow = ai.defineFlow(
  {
    name: 'generateRiskAnalysisFlow',
    inputSchema: GenerateRiskAnalysisInputSchema,
    outputSchema: GenerateRiskAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
