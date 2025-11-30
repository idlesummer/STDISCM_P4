'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

type TrainingMetric = {
  epoch: number
  batch: number
  batch_size: number
  batch_loss: number
  preds: number[]
  truths: number[]
}

type LossDataPoint = {
  batch: number
  loss: number
}

export default function Dashboard() {
  const [isTraining, setIsTraining] = useState(false)
  const [currentMetric, setCurrentMetric] = useState<TrainingMetric | null>(null)
  const [lossHistory, setLossHistory] = useState<LossDataPoint[]>([])
  const [fps, setFps] = useState(60)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())

  // FPS tracking
  useEffect(() => {
    let animationFrameId: number

    const updateFps = () => {
      frameCountRef.current++
      const currentTime = performance.now()
      const elapsed = currentTime - lastTimeRef.current

      if (elapsed >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / elapsed))
        frameCountRef.current = 0
        lastTimeRef.current = currentTime
      }

      animationFrameId = requestAnimationFrame(updateFps)
    }

    animationFrameId = requestAnimationFrame(updateFps)

    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  // Simulate training data for demonstration
  useEffect(() => {
    if (!isTraining) return

    const interval = setInterval(() => {
      const batch = lossHistory.length + 1
      const loss = Math.max(0.1, 2.5 * Math.exp(-batch * 0.05) + Math.random() * 0.2)

      const metric: TrainingMetric = {
        epoch: Math.floor(batch / 10) + 1,
        batch,
        batch_size: 32,
        batch_loss: loss,
        preds: Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)),
        truths: Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)),
      }

      setCurrentMetric(metric)
      setLossHistory(prev => [...prev, { batch, loss }])

      // Stop after 50 batches
      if (batch >= 50) {
        setIsTraining(false)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isTraining, lossHistory.length])

  const handleStart = useCallback(() => {
    setIsTraining(true)
    setLossHistory([])
    setCurrentMetric(null)
  }, [])

  const handleStop = useCallback(() => {
    setIsTraining(false)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-screen-2xl px-4 py-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Training Dashboard</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Real-time training metrics and model performance monitoring
            </p>
          </div>
          <Button
            onClick={isTraining ? handleStop : handleStart}
            variant={isTraining ? 'destructive' : 'default'}
            className="min-w-[120px]"
          >
            {isTraining ? 'Stop Training' : 'Start Training'}
          </Button>
        </div>

        {/* Metrics Overview */}
        <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">FPS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">{fps}</div>
              <p className="mt-0.5 text-xs text-muted-foreground">Frames per second</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Epoch</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {currentMetric?.epoch ?? '—'}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Current epoch</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Batch</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {currentMetric?.batch ?? '—'}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Current batch</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Batch Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {currentMetric?.batch_size ?? '—'}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Samples per batch</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tabular-nums">
                {currentMetric?.batch_loss.toFixed(4) ?? '—'}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Current batch loss</p>
            </CardContent>
          </Card>
        </div>

        {/* Training Loss Chart */}
        <Card className="mb-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Training Loss</CardTitle>
            <CardDescription className="text-xs">Real-time batch loss progression</CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <ChartContainer
              config={{
                loss: {
                  label: 'Loss',
                  color: '#3b82f6',
                },
              }}
              className="h-[220px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lossHistory} margin={{ top: 5, right: 5, bottom: 15, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-zinc-800" opacity={0.5} />
                  <XAxis
                    dataKey="batch"
                    label={{ value: 'Batch', position: 'insideBottom', offset: -10 }}
                    tick={{ fontSize: 11 }}
                    stroke="#6b7280"
                  />
                  <YAxis
                    label={{ value: 'Loss', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 11 }}
                    stroke="#6b7280"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="loss"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={false}
                    animationDuration={300}
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Predictions Grid */}
        {currentMetric && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Model Predictions</CardTitle>
              <CardDescription className="text-xs">
                Displaying {Math.min(16, currentMetric.preds.length)} samples from current batch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
                {currentMetric.preds.slice(0, 16).map((pred, idx) => {
                  const isCorrect = pred === currentMetric.truths[idx]
                  return (
                    <div key={idx} className="flex flex-col items-center space-y-2">
                      {/* Placeholder for MNIST image */}
                      <div className="relative aspect-square w-full overflow-hidden rounded-md border border-border bg-muted shadow-sm transition-all hover:shadow-md">
                        <div className="flex h-full items-center justify-center text-3xl font-bold text-muted-foreground/40">
                          {currentMetric.truths[idx]}
                        </div>
                      </div>

                      {/* Prediction vs Truth */}
                      <div className="flex w-full flex-col items-center gap-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <span className="text-[10px]">Pred:</span>
                          <span className={`rounded px-1 py-0.5 text-xs font-bold tabular-nums ${
                            isCorrect
                              ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                          }`}>
                            {pred}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Truth: <span className="font-semibold tabular-nums">{currentMetric.truths[idx]}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!currentMetric && !isTraining && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3 mb-3">
                <svg
                  className="h-6 w-6 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-muted-foreground">No training session active</p>
              <p className="mt-1 text-xs text-muted-foreground">Click "Start Training" to begin monitoring</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
