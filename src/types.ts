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
  // Add other properties as needed
};
