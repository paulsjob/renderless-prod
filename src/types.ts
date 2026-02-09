export type DataSource = 'static' | 'supabase';

export type ElementType = 'text' | 'image' | 'rectangle' | 'container';

export type LayoutElement = {
  id: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  locked: boolean;
  hidden: boolean;
  dataSource: DataSource;
  dataPath?: string;
  text?: string;
  src?: string;
};

export type LayoutState = {
  elements: LayoutElement[];
};
