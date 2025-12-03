// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var metrics_pb = require('./metrics_pb.js');

function serialize_services_StartReq(arg) {
  if (!(arg instanceof metrics_pb.StartReq)) {
    throw new Error('Expected argument of type services.StartReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_StartReq(buffer_arg) {
  return metrics_pb.StartReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_StartRes(arg) {
  if (!(arg instanceof metrics_pb.StartRes)) {
    throw new Error('Expected argument of type services.StartRes');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_StartRes(buffer_arg) {
  return metrics_pb.StartRes.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_StatusReq(arg) {
  if (!(arg instanceof metrics_pb.StatusReq)) {
    throw new Error('Expected argument of type services.StatusReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_StatusReq(buffer_arg) {
  return metrics_pb.StatusReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_StatusRes(arg) {
  if (!(arg instanceof metrics_pb.StatusRes)) {
    throw new Error('Expected argument of type services.StatusRes');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_StatusRes(buffer_arg) {
  return metrics_pb.StatusRes.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_SubscribeReq(arg) {
  if (!(arg instanceof metrics_pb.SubscribeReq)) {
    throw new Error('Expected argument of type services.SubscribeReq');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_SubscribeReq(buffer_arg) {
  return metrics_pb.SubscribeReq.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_services_TrainingMetric(arg) {
  if (!(arg instanceof metrics_pb.TrainingMetric)) {
    throw new Error('Expected argument of type services.TrainingMetric');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_services_TrainingMetric(buffer_arg) {
  return metrics_pb.TrainingMetric.deserializeBinary(new Uint8Array(buffer_arg));
}


// =========================
// ======== SERVICE ========
// =========================
//
var TrainingService = exports.TrainingService = {
  // Check server status (handshake)
status: {
    path: '/services.Training/Status',
    requestStream: false,
    responseStream: false,
    requestType: metrics_pb.StatusReq,
    responseType: metrics_pb.StatusRes,
    requestSerialize: serialize_services_StatusReq,
    requestDeserialize: deserialize_services_StatusReq,
    responseSerialize: serialize_services_StatusRes,
    responseDeserialize: deserialize_services_StatusRes,
  },
  // Start training with epochs and confirmation (stateless)
start: {
    path: '/services.Training/Start',
    requestStream: false,
    responseStream: false,
    requestType: metrics_pb.StartReq,
    responseType: metrics_pb.StartRes,
    requestSerialize: serialize_services_StartReq,
    requestDeserialize: deserialize_services_StartReq,
    responseSerialize: serialize_services_StartRes,
    responseDeserialize: deserialize_services_StartRes,
  },
  // Client subscribes to stream of metrics from server
subscribe: {
    path: '/services.Training/Subscribe',
    requestStream: false,
    responseStream: true,
    requestType: metrics_pb.SubscribeReq,
    responseType: metrics_pb.TrainingMetric,
    requestSerialize: serialize_services_SubscribeReq,
    requestDeserialize: deserialize_services_SubscribeReq,
    responseSerialize: serialize_services_TrainingMetric,
    responseDeserialize: deserialize_services_TrainingMetric,
  },
};

exports.TrainingClient = grpc.makeGenericClientConstructor(TrainingService, 'Training');
