export enum LayerType {
  Image = 'image',
  Video = 'video',
  PreComposition = 'precomposition',
}

export enum PlayState {
  None = 0,
  Play,
}

export interface FrameInfo {
  frames: number
  frameId: number
  width: number
  height: number
}

export interface TransformProps {
  anchorPoint: {
    inFrame: number
    value: number[]
  }[]
  position: {
    inFrame: number
    value: number[]
  }[]
  scale: {
    inFrame: number
    value: number[]
  }[]
  opacity: {
    inFrame: number
    value: number
  }[]
  rotationX?: {
    inFrame: number
    value: number
  }[]
  rotationY?: {
    inFrame: number
    value: number
  }[]
  rotationZ?: {
    inFrame: number
    value: number
  }[]
  orientation?: {
    inFrame: number
    value: number[]
    timeFunc?: number
  }[]
}

export interface LayerProps {
  type: string
  width: number
  height: number
  inFrame: number
  outFrame: number
  id?: number
  name?: string
  content?: string
  transform: TransformProps
  layers?: LayerProps[]
  trackMatteLayer?: LayerProps
}

export interface PlayProps {
  width: number
  height: number
  frameRate: number
  duration: number // 秒
  layers: LayerProps[]
}
