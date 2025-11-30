'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

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
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-screen-2xl px-8 py-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
          </div>
          <Button
            onClick={isTraining ? handleStop : handleStart}
            variant={isTraining ? 'destructive' : 'default'}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isTraining ? 'Stop Training' : 'Start Training'}
          </Button>
        </div>

        {/* Metrics Overview */}
        <div className="mb-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">FPS</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-gray-900 tabular-nums">{fps}</div>
              <p className="mt-1 text-xs text-gray-500">frames per second</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Epoch</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-gray-900 tabular-nums">
                {currentMetric?.epoch ?? '—'}
              </div>
              <p className="mt-1 text-xs text-gray-500">current epoch</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Batch</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-gray-900 tabular-nums">
                {currentMetric?.batch ?? '—'}
              </div>
              <p className="mt-1 text-xs text-gray-500">current batch</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Batch Size</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-gray-900 tabular-nums">
                {currentMetric?.batch_size ?? '—'}
              </div>
              <p className="mt-1 text-xs text-gray-500">samples per batch</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide">Loss</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-gray-900 tabular-nums">
                {currentMetric?.batch_loss.toFixed(4) ?? '—'}
              </div>
              <p className="mt-1 text-xs text-gray-500">current batch loss</p>
            </CardContent>
          </Card>
        </div>

        {/* Training Loss Chart */}
        <Card className="mb-6 border-0 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-gray-900">Training Loss</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ChartContainer
              config={{
                loss: {
                  label: 'Loss',
                  color: '#6366f1',
                },
              }}
              className="h-[280px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lossHistory} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="batch"
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    stroke="#e5e7eb"
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                    stroke="#e5e7eb"
                    tickLine={false}
                    axisLine={false}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="loss"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#colorLoss)"
                    animationDuration={300}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Predictions - Two Column Layout */}
        {currentMetric && (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column - First 8 predictions */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Batch Predictions (1-8)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentMetric.preds.slice(0, 8).map((pred, idx) => {
                    const isCorrect = pred === currentMetric.truths[idx]
                    return (
                      <div key={idx} className="flex items-center gap-4 py-2">
                        {/* Image placeholder */}
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <span className="text-3xl font-bold text-gray-400">
                            {currentMetric.truths[idx]}
                          </span>
                        </div>
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">Sample {idx + 1}</p>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                            <span>Ground Truth: <span className="font-semibold text-gray-700">{currentMetric.truths[idx]}</span></span>
                          </div>
                        </div>
                        {/* Prediction Badge */}
                        <div className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-semibold ${
                          isCorrect
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          Pred: {pred}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Right Column - Last 8 predictions */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Batch Predictions (9-16)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentMetric.preds.slice(8, 16).map((pred, idx) => {
                    const actualIdx = idx + 8
                    const isCorrect = pred === currentMetric.truths[actualIdx]
                    return (
                      <div key={actualIdx} className="flex items-center gap-4 py-2">
                        {/* Image placeholder */}
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <span className="text-3xl font-bold text-gray-400">
                            {currentMetric.truths[actualIdx]}
                          </span>
                        </div>
                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">Sample {actualIdx + 1}</p>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                            <span>Ground Truth: <span className="font-semibold text-gray-700">{currentMetric.truths[actualIdx]}</span></span>
                          </div>
                        </div>
                        {/* Prediction Badge */}
                        <div className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-semibold ${
                          isCorrect
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          Pred: {pred}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!currentMetric && !isTraining && (
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-gray-100 p-4 mb-4">
                <svg
                  className="h-8 w-8 text-gray-400"
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
              <p className="text-base font-medium text-gray-900">No training session active</p>
              <p className="mt-1 text-sm text-gray-500">Click "Start Training" to begin monitoring</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
