declare module "dom-to-image-more" {
  interface Options {
    width?: number;
    height?: number;
    quality?: number;
    cacheBust?: boolean;
    bgcolor?: string;
    style?: Record<string, string>;
    filter?: (node: Node) => boolean;
    imagePlaceholder?: string;
  }

  function toPng(node: Node, options?: Options): Promise<string>;
  function toJpeg(node: Node, options?: Options): Promise<string>;
  function toBlob(node: Node, options?: Options): Promise<Blob>;
  function toSvg(node: Node, options?: Options): Promise<string>;
  function toPixelData(node: Node, options?: Options): Promise<Uint8ClampedArray>;

  export { toPng, toJpeg, toBlob, toSvg, toPixelData, Options };
  const domtoimage: {
    toPng: typeof toPng;
    toJpeg: typeof toJpeg;
    toBlob: typeof toBlob;
    toSvg: typeof toSvg;
    toPixelData: typeof toPixelData;
  };
  export default domtoimage;
}
