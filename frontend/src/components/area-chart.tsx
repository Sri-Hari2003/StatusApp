"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "An interactive area chart"

type AreaChartIncidentsProps = {
  chartData: any[];
  chartConfig: Record<string, { label: string; color: string }>;
};

const AreaChartIncidents: React.FC<AreaChartIncidentsProps> = ({ chartData, chartConfig }) => {
  // Get all service keys (excluding 'date')
  const serviceKeys = Object.keys(chartConfig);

  return (
    <Card className="pt-0 mb-6">
      
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[380px] w-full"
        >
          <AreaChart data={chartData}>
            <defs>
              {serviceKeys.map((key) => (
                <linearGradient key={key} id={`fill${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="10%"
                    stopColor={chartConfig[key].color}
                    stopOpacity={0.7}
                  />
                  <stop
                    offset="90%"
                    stopColor={chartConfig[key].color}
                    stopOpacity={0.25}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis
              allowDecimals={false}
              domain={[0, (dataMax) => Math.max(2, dataMax + 1)]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            {serviceKeys.map((key) => (
              <Area
                key={key}
                dataKey={key}
                type="natural"
                fill="transparent"
                stroke={chartConfig[key].color}
                strokeWidth={2}
                stackId="a"
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default AreaChartIncidents; 