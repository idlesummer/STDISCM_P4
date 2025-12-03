export interface StartTrainingReq {
  numEpochs: number
}

export interface StartTrainingRes {
  status: string
  message: string
}

export interface StartTrainingError {
  error: string
}
