import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskAnalysisForm } from "./risk-analysis-form";

export default function RiskAnalysisPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Yapay Zeka Destekli Risk Analizi</CardTitle>
        <CardDescription>
          Proje detaylarını girerek potansiyel riskleri, azaltma stratejilerini ve genel risk değerlendirmesini alın.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RiskAnalysisForm />
      </CardContent>
    </Card>
  );
}
