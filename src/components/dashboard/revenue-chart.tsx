import { memo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPrice } from "@/hooks/useServicos";

export type RevenueChartPoint = { day: string; value: number };

type Props = {
  data: RevenueChartPoint[];
};

/** Gráfico de receita — chunk separado para lazy-load do recharts no dashboard. */
export const RevenueChart = memo(function RevenueChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) =>
            v === 0 ? "" : `R$${Math.round((v as number) / 100)}`
          }
        />
        <Tooltip
          formatter={(v) => [formatPrice(v as number), "Receita"]}
          labelStyle={{ fontSize: 11, fontWeight: 600 }}
          contentStyle={{
            fontSize: 12,
            borderRadius: 12,
            border: "1px solid var(--border)",
            background: "var(--card)",
          }}
          animationDuration={150}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#revenueGrad)"
          dot={false}
          isAnimationActive={false}
          activeDot={{ r: 4, fill: "var(--primary)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
});
