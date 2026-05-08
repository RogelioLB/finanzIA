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
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  stopRecordingOnSilence: (silenceThresholdMs?: number) => Promise<string | null>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

const SILENCE_THRESHOLD_DEFAULT = 1500;
const POLL_INTERVAL = 150;

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [uri, setUri] = useState<string | null>(null);
  const [durationState, setDurationState] = useState(0);
  const isPreparingRef = useRef(false);
  const wasRecordingRef = useRef(false);
  const lastSoundTimeRef = useRef<number>(0);
  const silenceCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);

  useEffect(() => {
    setDurationState(state.durationMillis || 0);
  }, [state.durationMillis]);

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

      await recorder.prepareToRecordAsync();
      recorder.record();
      setUri(null);
      lastSoundTimeRef.current = Date.now();
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

  const stopRecordingOnSilence = useCallback(async (silenceThresholdMs: number = SILENCE_THRESHOLD_DEFAULT): Promise<string | null> => {
    return new Promise((resolve) => {
      lastSoundTimeRef.current = Date.now();

      silenceCheckIntervalRef.current = setInterval(async () => {
        const now = Date.now();
        if (state.durationMillis > 0) {
          lastSoundTimeRef.current = now;
        }

        if (now - lastSoundTimeRef.current >= silenceThresholdMs) {
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
        }
      }, POLL_INTERVAL);
    });
  }, [recorder, state.isRecording, state.durationMillis]);

  const pauseRecording = useCallback(async () => {
  }, []);

  const resumeRecording = useCallback(async () => {
  }, []);

  return {
    isRecording: state.isRecording || false,
    isPaused: false,
    duration: durationState,
    uri,
    startRecording,
    stopRecording,
    stopRecordingOnSilence,
    pauseRecording,
    resumeRecording,
    requestPermission,
  };
}