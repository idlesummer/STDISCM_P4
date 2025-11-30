'use client'

import { useState, useCallback, useEffect } from 'react'
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
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Training Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor real-time training metrics and model predictions
            </p>
          </div>
          <Button
            onClick={isTraining ? handleStop : handleStart}
            variant={isTraining ? 'destructive' : 'default'}
            size="lg"
          >
            {isTraining ? 'Stop Training' : 'Start Training'}
          </Button>
        </div>

        {/* Training Loss Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Training Loss</CardTitle>
            <CardDescription>Batch loss over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                loss: {
                  label: 'Loss',
                  color: 'hsl(var(--chart-1))',
                },
              }}
              className="h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lossHistory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="batch"
                    label={{ value: 'Batch', position: 'insideBottom', offset: -5 }}
                    className="text-xs"
                  />
                  <YAxis
                    label={{ value: 'Loss', angle: -90, position: 'insideLeft' }}
                    className="text-xs"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="loss"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Current Batch Info */}
        {currentMetric && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Epoch</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentMetric.epoch}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Batch</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentMetric.batch}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Batch Size</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentMetric.batch_size}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Batch Loss</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentMetric.batch_loss.toFixed(4)}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Predictions Grid */}
        {currentMetric && (
          <Card>
            <CardHeader>
              <CardTitle>Current Batch Predictions</CardTitle>
              <CardDescription>
                Showing {Math.min(16, currentMetric.preds.length)} samples from batch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-8 gap-4">
                {currentMetric.preds.slice(0, 16).map((pred, idx) => (
                  <div key={idx} className="space-y-2">
                    {/* Placeholder for image - would show actual MNIST digit */}
                    <div className="aspect-square rounded-md bg-muted flex items-center justify-center text-4xl font-bold text-muted-foreground">
                      {currentMetric.truths[idx]}
                    </div>
                    {/* Prediction and Ground Truth */}
                    <div className="text-center space-y-1">
                      <div className="text-xs text-muted-foreground">Pred</div>
                      <div className={`text-sm font-bold ${pred === currentMetric.truths[idx] ? 'text-green-600' : 'text-red-600'}`}>
                        {pred}
                      </div>
                      <div className="text-xs text-muted-foreground">Truth</div>
                      <div className="text-sm font-medium">{currentMetric.truths[idx]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Placeholder when not training */}
        {!currentMetric && !isTraining && (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">No training data available</p>
                <p className="text-sm text-muted-foreground">Click "Start Training" to begin</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
