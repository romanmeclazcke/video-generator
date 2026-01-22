// Script to generate simple WAV files for DFS node visits
const fs = require('fs');
const path = require('path');

// Function to create a simple WAV file with a sine wave
function generateWavFile(filename, frequency, duration, sampleRate = 44100) {
  const numSamples = Math.floor(sampleRate * duration);
  const amplitude = 0.3;

  // Generate samples
  const samples = [];
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = amplitude * Math.sin(2 * Math.PI * frequency * t);
    // Apply fade out to avoid clicks
    const fadeOut = Math.min(1, (numSamples - i) / (sampleRate * 0.1));
    samples.push(sample * fadeOut);
  }

  // Create WAV file buffer
  const wavBuffer = createWavBuffer(samples, sampleRate);

  // Write to file
  const outputPath = path.join(__dirname, '..', 'public', 'audio', filename);
  fs.writeFileSync(outputPath, wavBuffer);
  console.log(`Generated: ${filename}`);
}

function createWavBuffer(samples, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const fileSize = 44 + dataSize;

  const buffer = Buffer.alloc(fileSize);
  let offset = 0;

  // RIFF chunk descriptor
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(fileSize - 8, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;

  // fmt sub-chunk
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4; // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, offset); offset += 2; // AudioFormat (1 for PCM)
  buffer.writeUInt16LE(numChannels, offset); offset += 2;
  buffer.writeUInt32LE(sampleRate, offset); offset += 4;
  buffer.writeUInt32LE(byteRate, offset); offset += 4;
  buffer.writeUInt16LE(blockAlign, offset); offset += 2;
  buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;

  // data sub-chunk
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;

  // Write samples
  for (const sample of samples) {
    const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  }

  return buffer;
}

// Generate audio files for each DFS node
// Frequencies: C5, D5, E5, F5, G5, A5
const nodes = [
  { id: 'A', frequency: 523.25 },
  { id: 'B', frequency: 587.33 },
  { id: 'D', frequency: 659.25 },
  { id: 'E', frequency: 698.46 },
  { id: 'C', frequency: 783.99 },
  { id: 'F', frequency: 880.00 },
];

console.log('Generating audio files for DFS visualization...\n');

nodes.forEach((node, index) => {
  generateWavFile(`node-${node.id}.wav`, node.frequency, 0.3);
});

console.log('\nAll audio files generated successfully!');
