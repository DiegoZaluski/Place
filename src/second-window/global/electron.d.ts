export {};

declare global {
  interface Window {
    electronAPI?: {
      sendControlAction: (type: string) => void;
      sendControlWindowResize: (width: number, height: number) => void;
      sendControlDragStart: (x: number, y: number) => void;
      sendControlDragMove: (x: number, y: number) => void;
      sendControlDragEnd: () => void;
    };
  }
}