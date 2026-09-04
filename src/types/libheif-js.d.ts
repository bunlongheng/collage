/** Minimal typing for the bundled WebAssembly build of libheif. */
declare module "libheif-js/wasm-bundle" {
  export interface HeifImage {
    get_width(): number;
    get_height(): number;
    display(target: ImageData, done: (data: ImageData | null) => void): void;
    free(): void;
  }
  export class HeifDecoder {
    decode(data: Uint8Array): HeifImage[];
  }
}
