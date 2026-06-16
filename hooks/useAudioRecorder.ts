"use client";

/**
 * useAudioRecorder
 *
 * Records audio via MediaRecorder, generates a live amplitude waveform
 * using Web Audio API AnalyserNode, and uploads the final blob to Telegram
 * via the existing /api/upload endpoint.
 */

import { useState, useRef, useCallback, useEffect } from "react";

export type RecorderState = "idle" | "recording" | "paused" | "done";

export interface AudioResult {
  blob: Blob;
  durationMs: number;
  waveformData: number[]; // 0-1 amplitude samples
}

export function useAudioRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [durationMs, setDurationMs] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [result, setResult] = useState<AudioResult | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const accumulatedMsRef = useRef<number>(0);

  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
  };

  const captureWaveform = useCallback(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(data);
    // Average absolute deviation from centre (128)
    const amplitude = Array.from(data).reduce((sum, v) => sum + Math.abs(v - 128), 0) / data.length / 128;
    setWaveformData(prev => [...prev, amplitude]);
    animFrameRef.current = requestAnimationFrame(captureWaveform);
  }, []);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const total = accumulatedMsRef.current;
        setResult({ blob, durationMs: total, waveformData: [] }); // waveformData set separately
        setDurationMs(total);
        setState("done");
      };

      recorder.start(100);
      startTimeRef.current = Date.now();
      accumulatedMsRef.current = 0;

      timerRef.current = setInterval(() => {
        setDurationMs(accumulatedMsRef.current + (Date.now() - startTimeRef.current));
      }, 100);

      captureWaveform();
      setState("recording");
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }, [captureWaveform]);

  const pause = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      accumulatedMsRef.current += Date.now() - startTimeRef.current;
      stopTimer();
      setState("paused");
    }
  }, []);

  const resume = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setDurationMs(accumulatedMsRef.current + (Date.now() - startTimeRef.current));
      }, 100);
      captureWaveform();
      setState("recording");
    }
  }, [captureWaveform]);

  const stop = useCallback(() => {
    accumulatedMsRef.current += Date.now() - startTimeRef.current;
    stopTimer();
    streamRef.current?.getTracks().forEach(t => t.stop());
    mediaRecorderRef.current?.stop();
    // state transitions to "done" in onstop handler
  }, []);

  const cancel = useCallback(() => {
    stopTimer();
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    chunksRef.current = [];
    setResult(null);
    setDurationMs(0);
    setWaveformData([]);
    accumulatedMsRef.current = 0;
    setState("idle");
  }, []);

  // Sync final waveformData into result once recording stops
  useEffect(() => {
    if (state === "done" && result) {
      setResult(prev => prev ? { ...prev, waveformData } : prev);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimer();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return {
    state,
    durationMs,
    waveformData,
    result,
    start,
    pause,
    resume,
    stop,
    cancel,
  };
}

/** Upload an AudioResult blob to Telegram via the existing /api/upload endpoint */
export async function uploadAudioToTelegram(result: AudioResult): Promise<string | null> {
  const formData = new FormData();
  formData.append("file", result.blob, "journal-audio.webm");
  formData.append("filename", "journal-audio.webm");

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) return null;

  const data = await res.json();
  return data.file_id ? `telegram:${data.file_id}` : null;
}

/** Format milliseconds as MM:SS */
export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const sec = (totalSec % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}
