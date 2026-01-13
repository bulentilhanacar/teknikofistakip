"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { performRiskAnalysis } from "./actions";
import type { GenerateRiskAnalysisOutput } from "@/ai/flows/generate-risk-analysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";

const formSchema = z.object({
  projectDescription: z.string().min(20, "Proje açıklaması en az 20 karakter olmalıdır."),
  projectTimeline: z.string().min(10, "Proje takvimi en az 10 karakter olmalıdır."),
  budgetDetails: z.string().min(10, "Bütçe detayları en az 10 karakter olmalıdır."),
  locationInfo: z.string().min(10, "Lokasyon bilgisi en az 10 karakter olmalıdır."),
  contractTerms: z.string().min(10, "Sözleşme şartları en az 10 karakter olmalıdır."),
});

type FormData = z.infer<typeof formSchema>;

export function RiskAnalysisForm() {
  const [analysisResult, setAnalysisResult] = useState<GenerateRiskAnalysisOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectDescription: "",
      projectTimeline: "",
      budgetDetails: "",
      locationInfo: "",
      contractTerms: "",
    },
  });

  async function onSubmit(values: FormData) {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);

    const result = await performRiskAnalysis(values);

    if (result.error) {
      setError(result.error);
    } else {
      setAnalysisResult(result.data);
    }
    setIsLoading(false);
  }

  return (
    <div className="grid gap-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="projectDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proje Açıklaması</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Projenin detaylı bir açıklaması..." rows={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="projectTimeline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proje Takvimi</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Projenin başlangıç, bitiş tarihleri ve önemli kilometre taşları..." rows={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="budgetDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bütçe Detayları</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Toplam bütçe, ana harcama kalemleri..." rows={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="locationInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lokasyon Bilgisi</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Proje sahasının adresi, zemin etüdü bilgileri, çevresel faktörler..." rows={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contractTerms"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Sözleşme Şartları</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Önemli sözleşme maddeleri, cezai şartlar, ödeme koşulları..." rows={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Analiz Et
          </Button>
        </form>
      </Form>

      {analysisResult && (
        <div className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><AlertTriangle className="text-destructive"/> Tanımlanan Riskler</CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm">{analysisResult.identifiedRisks}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><CheckCircle className="text-green-600"/> Azaltma Stratejileri</CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm">{analysisResult.mitigationStrategies}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Genel Risk Değerlendirmesi</CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm">{analysisResult.overallRiskAssessment}</CardContent>
          </Card>
        </div>
      )}
      {error && <p className="mt-4 text-destructive">{error}</p>}
    </div>
  );
}
