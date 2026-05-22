declare module "dom-to-image-more" {
  interface Options {
    filter?: (node: Node) => boolean;
    bgcolor?: string;
    width?: number;
    height?: number;
    style?: Partial<CSSStyleDeclaration>;
    quality?: number;
    imagePlaceholder?: string;
    cacheBust?: boolean;
    useCredentials?: boolean;
    httpTimeout?: number;
    preferredFontFormat?: string;
    fontEmbedCSS?: string;
    skipFonts?: boolean;
    scale?: number;
  }

  function toSvg(node: Node, options?: Options): Promise<string>;
  function toPng(node: Node, options?: Options): Promise<string>;
  function toJpeg(node: Node, options?: Options): Promise<string>;
  function toBlob(node: Node, options?: Options): Promise<Blob>;
  function toPixelData(node: Node, options?: Options): Promise<Uint8ClampedArray>;
  function toCanvas(node: Node, options?: Options): Promise<HTMLCanvasElement>;

  export { toSvg, toPng, toJpeg, toBlob, toPixelData, toCanvas, Options };
  export default { toSvg, toPng, toJpeg, toBlob, toPixelData, toCanvas };
}
