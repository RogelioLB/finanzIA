import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  useAudioRecorder, 
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  RecordingPresets,
} from 'expo-audio';

export interface UseVoiceRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  uri: string | null;
  metering: number | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  stopRecordingOnSilence: (options?: SilenceDetectionOptions) => Promise<string | null>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

export interface SilenceDetectionOptions {
  silenceThresholdDb?: number;
  silenceThresholdMs?: number;
  maxDurationMs?: number;
  minRecordingTimeMs?: number;
}

const SILENCE_THRESHOLD_DB = -50;
const SILENCE_THRESHOLD_MS = 1500;
const MAX_DURATION_MS = 15000;
const MIN_RECORDING_TIME_MS = 600;
const POLL_INTERVAL_MS = 100;
const METERING_FALLBACK_MS = 3000;

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [uri, setUri] = useState<string | null>(null);
  const [durationState, setDurationState] = useState(0);
  const [meteringState, setMeteringState] = useState<number | null>(null);
  const isPreparingRef = useRef(false);
  const wasRecordingRef = useRef(false);
  const lastSoundTimeRef = useRef<number>(0);
  const silenceCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const meteringStuckRef = useRef<number>(0);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder, POLL_INTERVAL_MS);

  useEffect(() => {
    setDurationState(state.durationMillis || 0);
    setMeteringState(state.metering ?? null);
  }, [state.durationMillis, state.metering]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      return granted;
    } catch {
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      if (wasRecordingRef.current) {
        console.log('[useVoiceRecorder] Already recording or not stopped');
        return;
      }

      if (isPreparingRef.current) {
        console.log('[useVoiceRecorder] Already preparing');
        return;
      }

      isPreparingRef.current = true;
      wasRecordingRef.current = false;
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        isPreparingRef.current = false;
        throw new Error('Microphone permission not granted');
      }

      await recorder.prepareToRecordAsync({
        ...RecordingPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      });
      recorder.record();
      setUri(null);
      lastSoundTimeRef.current = Date.now();
      meteringStuckRef.current = 0;
      wasRecordingRef.current = true;
      isPreparingRef.current = false;
    } catch (error) {
      isPreparingRef.current = false;
      wasRecordingRef.current = false;
      console.error('[useVoiceRecorder] Start error:', error);
      throw error;
    }
  }, [recorder, requestPermission]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      wasRecordingRef.current = false;
      if (silenceCheckIntervalRef.current) {
        clearInterval(silenceCheckIntervalRef.current);
        silenceCheckIntervalRef.current = null;
      }
      if (!state.isRecording) {
        return recorder.uri;
      }
      await recorder.stop();
      const recordedUri = recorder.uri;
      setUri(recordedUri);
      return recordedUri;
    } catch (error) {
      console.error('[useVoiceRecorder] Stop error:', error);
      return null;
    }
  }, [recorder, state.isRecording]);

  const stopRecordingOnSilence = useCallback(async (options?: SilenceDetectionOptions): Promise<string | null> => {
    const {
      silenceThresholdDb = SILENCE_THRESHOLD_DB,
      silenceThresholdMs = SILENCE_THRESHOLD_MS,
      maxDurationMs = MAX_DURATION_MS,
      minRecordingTimeMs = MIN_RECORDING_TIME_MS,
    } = options || {};

    return new Promise((resolve) => {
      const startTime = Date.now();
      let lastSoundTime = startTime;
      let lastMeteringValue = -160;
      let meteringStuckCount = 0;
      let useFallback = false;

      silenceCheckIntervalRef.current = setInterval(async () => {
        const now = Date.now();
        const elapsed = now - startTime;
        const currentMetering = state.metering ?? -160;
        const currentDuration = state.durationMillis;

        if (currentMetering > lastMeteringValue && currentMetering > -160) {
          lastSoundTime = now;
          lastMeteringValue = currentMetering;
          meteringStuckCount = 0;
        } else {
          meteringStuckCount++;
        }

        const silenceDuration = now - lastSoundTime;

        if (useFallback) {
          if (currentDuration > 0 && silenceDuration >= silenceThresholdMs) {
            if (silenceCheckIntervalRef.current) {
              clearInterval(silenceCheckIntervalRef.current);
              silenceCheckIntervalRef.current = null;
            }
            try {
              wasRecordingRef.current = false;
              if (state.isRecording) {
                await recorder.stop();
              }
              const recordedUri = recorder.uri;
              setUri(recordedUri);
              resolve(recordedUri);
            } catch (error) {
              console.error('[useVoiceRecorder] Stop on silence error:', error);
              resolve(null);
            }
            return;
          }
        } else {
          if (currentMetering >= silenceThresholdDb && elapsed >= minRecordingTimeMs && silenceDuration >= silenceThresholdMs) {
            if (silenceCheckIntervalRef.current) {
              clearInterval(silenceCheckIntervalRef.current);
              silenceCheckIntervalRef.current = null;
            }
            try {
              wasRecordingRef.current = false;
              if (state.isRecording) {
                await recorder.stop();
              }
              const recordedUri = recorder.uri;
              setUri(recordedUri);
              resolve(recordedUri);
            } catch (error) {
              console.error('[useVoiceRecorder] Stop on silence error:', error);
              resolve(null);
            }
            return;
          }

          if (meteringStuckCount * POLL_INTERVAL_MS >= METERING_FALLBACK_MS && currentMetering <= -160) {
            useFallback = true;
            console.log('[useVoiceRecorder] Metering stuck at -160, switching to duration-based fallback');
          }
        }

        if (elapsed >= maxDurationMs) {
          if (silenceCheckIntervalRef.current) {
            clearInterval(silenceCheckIntervalRef.current);
            silenceCheckIntervalRef.current = null;
          }
          try {
            wasRecordingRef.current = false;
            if (state.isRecording) {
              await recorder.stop();
            }
            const recordedUri = recorder.uri;
            setUri(recordedUri);
            resolve(recordedUri);
          } catch (error) {
            console.error('[useVoiceRecorder] Max duration error:', error);
            resolve(null);
          }
        }
      }, POLL_INTERVAL_MS);
    });
  }, [recorder, state.isRecording, state.metering, state.durationMillis]);

  const pauseRecording = useCallback(async () => {
  }, []);

  const resumeRecording = useCallback(async () => {
  }, []);

  return {
    isRecording: state.isRecording || false,
    isPaused: false,
    duration: durationState,
    metering: meteringState,
    uri,
    startRecording,
    stopRecording,
    stopRecordingOnSilence,
    pauseRecording,
    resumeRecording,
    requestPermission,
  };
}
