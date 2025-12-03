/**
 * Standalone gRPC client to test the training server
 * Run with: npx tsx test-grpc-client.ts
 */

import * as grpc from '@grpc/grpc-js'
import * as readline from 'readline'
import { TrainingClient } from './src/generated/metrics'

class Client {
  private client: TrainingClient
  private timeout: number

  constructor(target: string, timeout: number = 10000) {
    this.client = new TrainingClient(
      target,
      grpc.credentials.createInsecure()
    )
    this.timeout = timeout
    console.log(`📡 Client initialized (target=${target}, timeout=${timeout}ms)\n`)
  }

  async status(): Promise<any> {
    console.log('🔍 Checking server status...')

    return new Promise((resolve, reject) => {
      this.client.status({}, (error, response) => {
        if (error) {
          console.error(`❌ Failed to get status: ${error.code} - ${error.message}`)
          reject(error)
          return
        }

        console.log(`   Status: ${response.status}`)
        console.log(`   Message: ${response.message}`)
        if (response.epoch > 0) {
          console.log(`   Current epoch: ${response.epoch}`)
        }
        resolve(response)
      })
    })
  }

  async start(numEpochs: number, confirmed: boolean = true): Promise<any> {
    console.log(`🎬 Starting training (${numEpochs} epochs, confirmed=${confirmed})...`)

    return new Promise((resolve, reject) => {
      this.client.start({ numEpochs, confirmed }, (error, response) => {
        if (error) {
          console.error(`❌ Failed to start training: ${error.code} - ${error.message}`)
          reject(error)
          return
        }

        console.log(`   Status: ${response.status}`)
        console.log(`   Message: ${response.message}`)
        resolve(response)
      })
    })
  }

  subscribe(): void {
    console.log('📡 Subscribing to metrics stream...\n')

    const call = this.client.subscribe({})

    call.on('data', (metric) => {
      console.log('📊 Received Metric:')
      console.log(`   Epoch: ${metric.epoch}`)
      console.log(`   Batch: ${metric.batch}`)
      console.log(`   Batch Size: ${metric.batchSize}`)
      console.log(`   Batch Loss: ${metric.batchLoss.toFixed(4)}`)
      console.log(`   Predictions: [${metric.preds.slice(0, 10).join(', ')}...]`)
      console.log(`   Truths: [${metric.truths.slice(0, 10).join(', ')}...]`)
      console.log()
    })

    call.on('end', () => {
      console.log('🔌 Stream ended')
      process.exit(0)
    })

    call.on('error', (error) => {
      console.error(`❌ Streaming error: ${error.message}`)
      process.exit(1)
    })
  }

  close(): void {
    console.log('🔌 Closing client channel')
    this.client.close()
  }
}

async function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase())
    })
  })
}

async function main() {
  const target = 'localhost:50051'
  const numEpochs = 3
  const client = new Client(target)

  console.log(`📡 Connected to training server at ${target}.\n`)

  try {
    // Step 1: Check server status (handshake)
    const status = await client.status()
    console.log()

    if (status.status === 'training') {
      console.log(`⚠️  Server is already training at epoch ${status.epoch}. Exiting.`)
      process.exit(0)
    }

    if (status.status !== 'ready') {
      console.log('⚠️  Server not ready. Exiting.')
      process.exit(0)
    }

    // Step 2: Ask user for confirmation
    console.log(`❓ Start training with ${numEpochs} epochs?`)
    const confirmation = await askQuestion('   Type "yes" to proceed: ')

    if (confirmation !== 'yes') {
      console.log('❌ Training cancelled by user.')
      process.exit(0)
    }

    // Step 3: Start training
    console.log()
    const startRes = await client.start(numEpochs, true)
    console.log()

    if (startRes.status !== 'started') {
      console.log('⚠️  Training not started. Exiting.')
      process.exit(0)
    }

    // Step 4: Subscribe to metrics stream
    client.subscribe()

  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`)
    process.exit(1)
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n⏹️  Interrupted by user')
  process.exit(0)
})

main()
