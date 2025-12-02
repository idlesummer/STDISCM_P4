'use client'

// Global imports
import { useState } from 'react'
import { Hash, Layers, Pause, Play, RotateCwSquare, Smile, TableProperties, TrendingDown, Zap } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts'

// Component imports
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Typography3XL, TypographyH2, TypographyMuted, TypographyXS } from '@/components/ui/typography'

// Local imports
import { useFakeTraining } from './_hooks/use-fake-training'
import { useFPS } from './_hooks/use-fps'


export default function DashboardPage() {
  // Training state hooks
  const [isTraining, setIsTraining] = useState(false)

  // Custom hooks
  const { fps, fpsChange, fpsHistory } = useFPS()
  const { metric, lossHistory, resetTraining } = useFakeTraining(isTraining, setIsTraining)

  // Handler functions
  const handleStop = () => setIsTraining(false)
  const handleStart = () => { 
    resetTraining()
    setIsTraining(true)
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="mx-auto max-w-screen-2xl px-8 py-6">

        {/* Header */}
        <div className="mb-8">
          <TypographyH2>Dashboard</TypographyH2>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <div className="mb-6">
            <TabsList className="h-auto gap-8 rounded-none border-none bg-transparent p-0">
              {['Overview', 'Playground'].map((label, i) => (
                <TabsTrigger
                  key={i}
                  value={label.toLowerCase()}
                  className="
                    rounded-none
                    border-0 border-b-2 border-transparent
                    bg-transparent
                    px-0 pb-3 pt-0
                    text-muted-foreground
                    hover:text-gray-700
                    data-[state=active]:border-gray-900
                    data-[state=active]:bg-transparent
                    data-[state=active]:text-foreground
                    data-[state=active]:shadow-none
                ">
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
            <Separator/>
          </div>

          <TabsContent value="overview">
  
            {/* Training Metrics Report with Chart */}
            <Card className="mb-6 border bg-card rounded-lg">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">Training Report</CardTitle>
                    <TypographyMuted className="mt-1">Real-time batch metrics and loss progression</TypographyMuted>
                  </div>
                  <Button
                    onClick={isTraining ? handleStop : handleStart}
                    variant={isTraining ? 'destructive' : 'default'}
                  >
                    {isTraining 
                      ? (<><Pause className="mr-2 fill-current" /> Stop Training</>) 
                      : (<><Play className="mr-2 fill-current" /> Start Training</>)}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Metrics Grid */}
                <div className="grid grid-cols-5 gap-6 mb-6">
                  
                  {/* Epoch */}
                  <div className="border-r border-border pr-6">
                    <div className="flex items-center gap-2 mb-2">
                      <RotateCwSquare  className="w-4 h-4 text-muted-foreground" />
                      <TypographyXS className="font-medium">Epoch</TypographyXS>                     
                    </div>
                    <Typography3XL className="font-bold tabular-nums">
                      {metric?.epoch ?? '—'}
                    </Typography3XL>
                    <TypographyXS className="mt-1">current epoch</TypographyXS>
                  </div>
                  
                  {/* <Separator orientation="vertical" className="h-full bg-gray-200" /> */}

                  {/* Batch */}
                  <div className="border-r border-border pr-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="w-4 h-4 text-muted-foreground" />
                      <TypographyXS className="font-medium">Batch</TypographyXS>
                    </div>
                    <Typography3XL className="font-bold tabular-nums">
                      {metric?.batch ?? '—'}
                    </Typography3XL>
                    <TypographyXS className="mt-1">current batch</TypographyXS>
                  </div>

                  {/* Loss */}
                  <div className="border-r border-border pr-6">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-4 h-4 text-muted-foreground" />
                      <TypographyXS className="font-medium">Loss</TypographyXS>
                      
                    </div>
                     <Typography3XL className="font-bold tabular-nums">
                        {metric?.batch_loss.toFixed(4) ?? '—'}
                     </Typography3XL>
                    <TypographyXS className="mt-1">current batch loss</TypographyXS>
                  </div>

                  {/* Batch Size */}
                  <div className="border-r border-border pr-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      <TypographyXS className="font-medium">Batch Size</TypographyXS>
                    </div>
                     <Typography3XL className="font-bold tabular-nums">
                        {metric?.batch_size ?? '—'}
                     </Typography3XL>
                    <TypographyXS className="mt-1">samples per batch</TypographyXS>
                  </div>

                  {/* FPS */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-muted-foreground" />
                      <TypographyXS className="font-medium">FPS</TypographyXS>
                    </div>
                    <div className="flex items-end gap-3">
                      <Typography3XL className="font-bold tabular-nums">{fps}</Typography3XL>
                      {fpsHistory.length > 1 && (
                        <div className="flex-1 h-8 mb-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={fpsHistory}>
                              <Line
                                type="monotone"
                                dataKey="fps"
                                stroke={fpsChange >= 0 ? '#10b981' : '#ef4444'}
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                    <TypographyXS className="mt-1">
                      frames per second
                      {fpsChange ? (fpsChange > 0 ? ' ↑' : ' ↓') : ''}
                    </TypographyXS>
                  </div>
                </div>

                {/* Chart */}
                <div className="border border-border rounded-lg p-4 bg-card">
                  <ChartContainer
                    config={{ loss: { label: 'Loss', color: '#000000' } }}
                    className="h-[280px] w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={lossHistory} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
                        <defs>
                          <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#000000" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#000000" stopOpacity={0.02}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={true} horizontal={true} />
                        <XAxis
                          dataKey="batch"
                          tick={{ fontSize: 12, fill: '#9ca3af' }}
                          stroke="#e5e7eb"
                          tickLine={false}
                          label={{ value: 'Batch', position: 'insideBottom', offset: -15, fill: '#6b7280' }}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#9ca3af' }}
                          stroke="#e5e7eb"
                          tickLine={false}
                          axisLine={false}
                          label={{ value: 'Loss', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                          type="monotone"
                          dataKey="loss"
                          stroke="#000000"
                          strokeWidth={2}
                          fill="url(#colorLoss)"
                          animationDuration={300}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>

            {/* Predictions */}
            {metric && (
              <Card className="mb-6 border bg-card rounded-lg">
                <CardHeader>
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">Batch Predictions</CardTitle>
                    <TypographyMuted className="mt-1">Model predictions for current training batch</TypographyMuted>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid lg:grid-cols-2 gap-0 lg:divide-x divide-gray-200">
                    {/* Left Column - First 8 predictions */}
                    <div className="lg:pr-6">
                      {/* <div className="flex items-center gap-2 mb-4">
                        <ClipboardList className="w-5 h-5 text-muted-foreground" />
                        <h3 className="text-base font-medium text-foreground">Samples 1-8</h3>
                      </div> */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Image</TableHead>
                          <TableHead>Sample</TableHead>
                          <TableHead>Predicted Label</TableHead>
                          <TableHead>True Label</TableHead>
                          <TableHead className="text-muted-foreground">Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {metric.preds.slice(0, 8).map((pred, idx) => {
                          const isCorrect = pred === metric.truths[idx]
                          return (
                            <TableRow
                              key={idx}
                              className={isCorrect ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'}
                            >
                              <TableCell>
                                <div className="w-16 h-16 rounded-lg bg-card border border-border flex items-center justify-center">
                                  <Typography3XL className="text-muted-foreground font-bold">
                                    {metric.truths[idx]}
                                  </Typography3XL>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">Sample {idx + 1}</TableCell>
                              <TableCell className="font-semibold text-lg">{pred}</TableCell>
                              <TableCell className="font-semibold text-lg">{metric.truths[idx]}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">{metric.scores[idx].toFixed(3)}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                    </div>

                    {/* Right Column - Last 8 predictions */}
                    <div className="lg:pl-6 mt-6 lg:mt-0">
                      {/* <div className="flex items-center gap-2 mb-4">
                        <ClipboardList className="w-5 h-5 text-muted-foreground" />
                        <h3 className="text-base font-medium text-foreground">Samples 9-16</h3>
                      </div> */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Image</TableHead>
                          <TableHead>Sample</TableHead>
                          <TableHead>Predicted Label</TableHead>
                          <TableHead>True Label</TableHead>
                          <TableHead className="text-muted-foreground">Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {metric.preds.slice(8, 16).map((pred, idx) => {
                          const actualIdx = idx + 8
                          const isCorrect = pred === metric.truths[actualIdx]
                          return (
                            <TableRow
                              key={actualIdx}
                              className={isCorrect ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'}
                            >
                              <TableCell>
                                <div className="w-16 h-16 rounded-lg bg-card border border-border flex items-center justify-center">
                                  <Typography3XL className="text-muted-foreground font-bold">
                                    {metric.truths[actualIdx]}
                                  </Typography3XL>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">Sample {actualIdx + 1}</TableCell>
                              <TableCell className="font-semibold text-lg">{pred}</TableCell>
                              <TableCell className="font-semibold text-lg">{metric.truths[actualIdx]}</TableCell>
                              <TableCell className="text-muted-foreground text-sm">{metric.scores[actualIdx].toFixed(3)}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {!metric && !isTraining && (
              <Empty className="border border-border bg-card">
                <EmptyHeader>
                  <EmptyMedia variant="icon" className="bg-gray-100">
                    <TableProperties className="h-8 w-8 text-muted-foreground" />
                  </EmptyMedia>
                  <EmptyTitle className="text-foreground">No training session active</EmptyTitle>
                  <EmptyDescription className="text-muted-foreground">{'Click "Start Training" to begin monitoring'}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </TabsContent>

          <TabsContent value="playground">
            <Empty className="border border-border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="bg-gray-100">
                  <Smile className="h-8 w-8 text-muted-foreground" />
                </EmptyMedia>
                <EmptyTitle className="text-foreground">Playground Coming Soon</EmptyTitle>
                <EmptyDescription className="text-muted-foreground">Draw digits and see live predictions</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
