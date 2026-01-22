import { useEffect, useRef } from "react";

type AudioEffectOptions = {
  frequency: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
};

export const useAudioEffect = (
  shouldPlay: boolean,
  options: AudioEffectOptions
) => {
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    if (shouldPlay && !hasPlayedRef.current) {
      hasPlayedRef.current = true;
      playTone(options);
    }

    if (!shouldPlay) {
      hasPlayedRef.current = false;
    }
  }, [shouldPlay, options]);
};

const playTone = ({
  frequency,
  duration,
  type = "sine",
  volume = 0.3,
}: AudioEffectOptions) => {
  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);

    setTimeout(() => {
      audioContext.close();
    }, duration * 1000 + 100);
  } catch (error) {
    console.error("Error playing audio:", error);
  }
};
