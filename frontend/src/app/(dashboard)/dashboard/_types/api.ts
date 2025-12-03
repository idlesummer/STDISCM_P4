export interface StartTrainingRequest {
  numEpochs: number
}

export interface StartTrainingResponse {
  status: string
  message: string
}

export interface StartTrainingError {
  error: string
}
