"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { fetchUserProgress, ProgressData } from "@/services/db";
import { useAuth } from "@/context/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  vocabulary: {
    label: "Vocabulary",
    color: "var(--primary)",
  },
  grammar: {
    label: "Grammar",
    color: "var(--secondary)",
  },
} satisfies ChartConfig;

interface ProgressChartProps {
  userId?: string;
}

export function ProgressChart({ userId: propUserId }: ProgressChartProps) {
  const { profile } = useAuth();
  const [data, setData] = useState<ProgressData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Use the prop userId (for admin) or the current user's profile ID (for student)
  const targetUserId = propUserId || profile?.uid;

  useEffect(() => {
    async function loadData() {
      if (!targetUserId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const result = await fetchUserProgress(targetUserId);
      setData(result);
      setIsLoading(false);
    }
    loadData();
  }, [targetUserId]);

  if (isLoading) {
    return (
      <Card className="w-full flex-1 min-h-[300px] flex items-center justify-center border-2 border-border/50 shadow-sm">
        <div className="animate-pulse space-y-4 w-full px-8">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-[200px] bg-muted rounded w-full"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full border-2 border-b-4 border-border/60 shadow-none hover:border-border transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight">Your Progress</CardTitle>
        <CardDescription className="text-sm sm:text-base text-muted-foreground font-bold">Vocabulary and Grammar learned over the last 7 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full mt-4">
          <AreaChart
            data={data}
            margin={{
              left: -20,
              right: 12,
              top: 12,
              bottom: 0,
            }}
          >
            {/* Removed corporate CartesianGrid for a cleaner feel */}
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", { weekday: "short" });
              }}
              className="text-xs font-black uppercase text-muted-foreground/80"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickCount={5}
              allowDecimals={false}
              className="text-xs font-black text-muted-foreground/80"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent />}
            />
            <Area
              type="monotone"
              dataKey="grammar"
              stroke="var(--color-grammar)"
              fill="var(--color-grammar)"
              fillOpacity={0.3}
              strokeWidth={4}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="vocabulary"
              stroke="var(--color-vocabulary)"
              fill="var(--color-vocabulary)"
              fillOpacity={0.3}
              strokeWidth={4}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
