export type TrainingMetric = {
  epoch: number
  batch: number
  batch_size: number
  batch_loss: number
  preds: number[]
  truths: number[]
  scores: number[]
  image_ids: number[]
}

export type LossDataPoint = {
  batch: number
  loss: number
}
