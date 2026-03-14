declare module 'jsfxr' {
  interface SynthDef {
    [key: string]: number | boolean;
  }
  interface SfxrAudio {
    play(): void;
    setVolume(v: number): SfxrAudio;
  }
  interface SfxrApi {
    generate(algorithm: string, options?: Record<string, number>): SynthDef;
    play(synthdef: SynthDef): void;
    toAudio(synthdef: SynthDef): SfxrAudio;
    toWave(synthdef: SynthDef): unknown;
  }
  export const sfxr: SfxrApi;
  const jsfxr: { sfxr: SfxrApi };
  export default jsfxr;
}
