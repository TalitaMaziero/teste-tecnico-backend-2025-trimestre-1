import { uploadVideo, getVideo } from '../services/videoService.js';

export function uploadHandler(req, res) {
  return uploadVideo(req, res);
}

export function streamHandler(req, res) {
  return getVideo(req, res);
}