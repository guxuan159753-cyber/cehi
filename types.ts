export interface WheelItem {
  id: string;
  label: string;
  color: string;
}

export interface SpinResult {
  winner: WheelItem;
  rotation: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING_ITEMS = 'GENERATING_ITEMS',
  SPINNING = 'SPINNING',
  SHOWING_RESULT = 'SHOWING_RESULT',
}