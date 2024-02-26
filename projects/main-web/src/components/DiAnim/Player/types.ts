export enum DiLayerType {
  Image = 'image',
  Video = 'video',
  Precomposition = 'precomposition',
}

export interface DiLayerProps {
  type: string
  name: string
  content?: string
  transform: {
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
  }
  layers?: DiLayerProps[]
}

export interface DiPlayProps {
  width: number
  height: number
  frameRate: number
  duration: number // 秒
  layers: DiLayerProps[]
}

export enum DiPlayState {
  None = 0,
  Play,
}

export interface DiFrameInfo {
  frameId: number
  width: number
  height: number
  isEnd?: boolean
}
