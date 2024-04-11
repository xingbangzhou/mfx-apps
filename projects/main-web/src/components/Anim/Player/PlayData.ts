import {PlayProps} from './types'

export default class PlayData {
  constructor() {}

  private _props?: PlayProps

  private _frameRate = 30
  private _frames = 0
  private _frameMs = 0
  private _frameId = -1

  setPlayProps(props: PlayProps) {
    this._props = props
    this._frameRate = props?.frameRate || 30
    this._frames = (props?.duration || 0) * props.frameRate
    this._frameMs = 1000 / this._frameRate
  }

  get frameRate() {
    return this._frameRate
  }

  get frames() {
    return this._frames
  }

  get frameMs() {
    return this._frameMs
  }

  get width() {
    return this._props?.width || 0
  }

  get height() {
    return this._props?.height || 0
  }

  get duration() {
    return this._props?.duration
  }

  set frameId(id: number) {
    this._frameId = id
  }

  get frameId() {
    return this._frameId
  }

  get rootLayers() {
    return this._props?.targetComp.layers
  }

  getLayerByComps(id: number) {
    return this._props?.comps.find(el => el.id === id)
  }
}