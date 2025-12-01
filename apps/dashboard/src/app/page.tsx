'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts'

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

type FPSDataPoint = {
  time: number
  fps: number
}

export default function Dashboard() {
  const [isTraining, setIsTraining] = useState(false)
  const [currentMetric, setCurrentMetric] = useState<TrainingMetric | null>(null)
  const [lossHistory, setLossHistory] = useState<LossDataPoint[]>([])
  const [fps, setFps] = useState(60)
  const [fpsHistory, setFpsHistory] = useState<FPSDataPoint[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(0)
  const fpsTimeRef = useRef(0)

  // FPS tracking with history
  useEffect(() => {
    let animationFrameId: number
    lastTimeRef.current = performance.now()

    const updateFps = () => {
      frameCountRef.current++
      const currentTime = performance.now()
      const elapsed = currentTime - lastTimeRef.current

      if (elapsed >= 1000) {
        const newFps = Math.round((frameCountRef.current * 1000) / elapsed)
        setFps(newFps)

        // Update FPS history (keep last 20 data points)
        setFpsHistory(prev => {
          const updated = [...prev, { time: fpsTimeRef.current++, fps: newFps }]
          return updated.slice(-20)
        })

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

  // Calculate FPS trend
  const fpsTrend = fpsHistory.length >= 2
    ? fpsHistory[fpsHistory.length - 1].fps - fpsHistory[fpsHistory.length - 2].fps
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-screen-2xl px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'overview'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('playground')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'playground'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Playground
            </button>
          </nav>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Training Metrics Report with Chart */}
            <Card className="mb-6 border shadow-sm bg-white rounded-lg">
              <CardHeader className="pb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Training Report</CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Real-time batch metrics and loss progression</p>
                  </div>
                  <Button
                    onClick={isTraining ? handleStop : handleStart}
                    variant={isTraining ? 'destructive' : 'default'}
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    {isTraining ? (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <rect x="6" y="5" width="2.5" height="10" />
                          <rect x="11.5" y="5" width="2.5" height="10" />
                        </svg>
                        Stop Training
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                        Start Training
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Metrics Grid */}
                <div className="grid grid-cols-5 gap-6 mb-6">
                  <div className="border-r border-gray-200 pr-6">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      <p className="text-xs text-gray-500 font-medium">Epoch</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 tabular-nums">
                      {currentMetric?.epoch ?? '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">current epoch</p>
                  </div>
                  <div className="border-r border-gray-200 pr-6">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <p className="text-xs text-gray-500 font-medium">Batch</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 tabular-nums">
                      {currentMetric?.batch ?? '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">current batch</p>
                  </div>
                  <div className="border-r border-gray-200 pr-6">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                      <p className="text-xs text-gray-500 font-medium">Batch Size</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 tabular-nums">
                      {currentMetric?.batch_size ?? '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">samples per batch</p>
                  </div>
                  <div className="border-r border-gray-200 pr-6">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                      <p className="text-xs text-gray-500 font-medium">Loss</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 tabular-nums">
                      {currentMetric?.batch_loss.toFixed(4) ?? '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">current batch loss</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <p className="text-xs text-gray-500 font-medium">FPS</p>
                    </div>
                    <div className="flex items-end gap-3">
                      <p className="text-3xl font-bold text-gray-900 tabular-nums">{fps}</p>
                      {fpsHistory.length > 1 && (
                        <div className="flex-1 h-8 mb-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={fpsHistory}>
                              <Line
                                type="monotone"
                                dataKey="fps"
                                stroke={fpsTrend >= 0 ? '#10b981' : '#ef4444'}
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      frames per second
                      {fpsTrend !== 0 && (
                        <span className={`ml-1 ${fpsTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {fpsTrend >= 0 ? '↑' : '↓'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Chart */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <ChartContainer
                    config={{
                      loss: {
                        label: 'Loss',
                        color: '#000000',
                      },
                    }}
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

            {/* Predictions - Two Column Layout */}
            {currentMetric && (
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Left Column - First 8 predictions */}
                <Card className="border shadow-sm bg-white rounded-lg">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      <CardTitle className="text-lg font-semibold text-gray-900">Batch Predictions (1-8)</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Image</TableHead>
                          <TableHead>Sample</TableHead>
                          <TableHead>Prediction</TableHead>
                          <TableHead>Ground Truth</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentMetric.preds.slice(0, 8).map((pred, idx) => {
                          const isCorrect = pred === currentMetric.truths[idx]
                          return (
                            <TableRow
                              key={idx}
                              className={isCorrect ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'}
                            >
                              <TableCell>
                                <div className="w-16 h-16 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                                  <span className="text-3xl font-bold text-gray-400">
                                    {currentMetric.truths[idx]}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">Sample {idx + 1}</TableCell>
                              <TableCell className="font-semibold text-lg">{pred}</TableCell>
                              <TableCell className="font-semibold text-lg">{currentMetric.truths[idx]}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Right Column - Last 8 predictions */}
                <Card className="border shadow-sm bg-white rounded-lg">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      <CardTitle className="text-lg font-semibold text-gray-900">Batch Predictions (9-16)</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Image</TableHead>
                          <TableHead>Sample</TableHead>
                          <TableHead>Prediction</TableHead>
                          <TableHead>Ground Truth</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentMetric.preds.slice(8, 16).map((pred, idx) => {
                          const actualIdx = idx + 8
                          const isCorrect = pred === currentMetric.truths[actualIdx]
                          return (
                            <TableRow
                              key={actualIdx}
                              className={isCorrect ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'}
                            >
                              <TableCell>
                                <div className="w-16 h-16 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                                  <span className="text-3xl font-bold text-gray-400">
                                    {currentMetric.truths[actualIdx]}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">Sample {actualIdx + 1}</TableCell>
                              <TableCell className="font-semibold text-lg">{pred}</TableCell>
                              <TableCell className="font-semibold text-lg">{currentMetric.truths[actualIdx]}</TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Empty State */}
            {!currentMetric && !isTraining && (
              <Card className="border shadow-sm bg-white rounded-lg">
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
                  <p className="mt-1 text-sm text-gray-500">{'Click "Start Training" to begin monitoring'}</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {activeTab === 'playground' && (
          <Card className="border shadow-sm bg-white rounded-lg">
            <CardContent className="flex flex-col items-center justify-center py-20">
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
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-base font-medium text-gray-900">Playground Coming Soon</p>
              <p className="mt-1 text-sm text-gray-500">Draw digits and see live predictions</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
