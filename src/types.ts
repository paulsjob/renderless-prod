export type Element = {
  id: string;
  type: 'text' | 'image' | 'shape' | 'container';
  name: string;
  locked: boolean;
  hidden: boolean;
  visible: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  dataSource?: string;
  dataPath?: string;
  fill?: string;
  borderColor?: string;
  borderWidth?: number;
  text?: string;
  src?: string;
  fontSize?: number;
  maskEnabled?: boolean;
  // Add other properties as needed
};

export type Layout = {
  id: string;
  name: string;
  aspect_ratio: '16:9' | '9:16';
  elements: Element[];
};
