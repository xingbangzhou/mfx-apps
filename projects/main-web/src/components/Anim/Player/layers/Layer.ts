import {ThisWebGLContext, createTexture, degToRad, drawTexRectangle, m4} from '../base'
import {str$m4} from '../base/m4'
import {Transform3D} from '../base/transforms'
import {FrameInfo, LayerProps, LayerType} from '../types'
import Drawer from './AbstractDrawer'
import ImageDrawer from './ImageDrawer'
import PreComposeDrawer from './PreComposeDrawer'
import VideoDrawer from './VideoDrawer'

function newDrawer(props: LayerProps, layerRef: Layer) {
  const type = props.type
  switch (type) {
    case LayerType.Video:
      return new VideoDrawer(layerRef)
    case LayerType.Image:
      return new ImageDrawer(layerRef)
    case LayerType.PreComposition:
      return new PreComposeDrawer(layerRef)
  }

  return undefined
}

export default class Layer {
  constructor(props: LayerProps) {
    this._props = props
    this._transform3D = new Transform3D(props.transform)

    this._drawer = newDrawer(props, this)
    if (props.trackMatteLayer) {
      this._trackMatteLayer = new Layer(props.trackMatteLayer)
    }
  }

  private _props: LayerProps
  private _transform3D: Transform3D
  private _drawer?: Drawer
  private _projectionMatrix?: m4.Mat4

  // 遮罩
  private _trackMatteLayer?: Layer
  private _trackFramebuffer?: WebGLFramebuffer & {texture: WebGLTexture}
  private _trackFramebuffer0?: WebGLFramebuffer & {texture: WebGLTexture}

  get props() {
    return this._props
  }

  get transform3D() {
    return this._transform3D
  }

  get width() {
    return this._props.width
  }

  get height() {
    return this._props.height
  }

  get projectionMatrix() {
    if (!this._projectionMatrix) {
      const viewWidth = this.width
      const viewHeight = this.height
      this._projectionMatrix = m4.worldProjection(viewWidth, viewHeight)
    }
    return this._projectionMatrix
  }

  getFrameMatrix({frameId}: FrameInfo) {
    const anchorPoint = this.transform3D.getAnchorPoint(frameId)
    const position = this.transform3D.getPosition(frameId)
    const scale = this.transform3D.getScale(frameId)
    const rotation = this.transform3D.getRotation(frameId)

    if (!anchorPoint || !position) return null

    const [x, y, z] = position
    let matrix = m4.translation(x, -y, -z)

    if (rotation) {
      rotation[0] && (matrix = m4.xRotate(matrix, degToRad(rotation[0])))
      rotation[1] && (matrix = m4.yRotate(matrix, degToRad(360 - rotation[1])))
      rotation[2] && (matrix = m4.zRotate(matrix, degToRad(360 - rotation[2])))
    }
    if (scale) {
      matrix = m4.scale(matrix, (scale[0] || 100) * 0.01, (scale[1] || 100) * 0.01, (scale[2] || 100) * 0.01)
    }

    const moveOrighMatrix = m4.translation(-anchorPoint[0], anchorPoint[1], 0)
    matrix = m4.multiply(matrix, moveOrighMatrix)

    return matrix
  }

  async init(gl: ThisWebGLContext) {
    if (this._trackMatteLayer) {
      await this._trackMatteLayer?.init(gl)
    }
    await this._drawer?.init(gl)
  }

  render(
    gl: ThisWebGLContext,
    parentMatrix: m4.Mat4,
    frameInfo: FrameInfo,
    parentFramebuffer: WebGLFramebuffer | null = null,
  ) {
    if (!this._drawer) return
    const localMatrix = this.getFrameMatrix(frameInfo)
    if (!localMatrix) return

    const {width: parentWidth, height: parentHeight} = frameInfo

    // 设置透明度
    const opcaity = this.transform3D.getOpacity(frameInfo.frameId)
    gl.uniform1f(gl.uniforms.opacity, opcaity)

    // 遮罩处理
    if (this._trackMatteLayer) {
      // 绘制遮罩
      const framebuffer =
        this._trackFramebuffer || (gl.createFramebuffer() as WebGLFramebuffer & {texture: WebGLTexture})
      {
        if (!framebuffer.texture) {
          framebuffer.texture = createTexture(gl) as WebGLTexture
        }
        this._trackFramebuffer = framebuffer
        gl.bindTexture(gl.TEXTURE_2D, framebuffer.texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, parentWidth, parentHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
        gl.bindTexture(gl.TEXTURE_2D, null)
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, framebuffer.texture, 0)

        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
        if (gl.FRAMEBUFFER_COMPLETE !== status) {
          console.log('Framebuffer object is incomplete: ' + status.toString())
        }

        gl.viewport(0, 0, parentWidth, parentHeight)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        this._trackMatteLayer.render(gl, parentMatrix, frameInfo, framebuffer)

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0)
        gl.bindFramebuffer(gl.FRAMEBUFFER, parentFramebuffer || null)
      }

      // 绘制纹理
      const framebuffer0 =
        this._trackFramebuffer0 || (gl.createFramebuffer() as WebGLFramebuffer & {texture: WebGLTexture})
      {
        if (!framebuffer0.texture) {
          framebuffer0.texture = createTexture(gl) as WebGLTexture
        }
        this._trackFramebuffer0 = framebuffer0
        gl.bindTexture(gl.TEXTURE_2D, framebuffer0.texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, parentWidth, parentHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
        gl.bindTexture(gl.TEXTURE_2D, null)
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer0)
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, framebuffer0.texture, 0)

        const status0 = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
        if (gl.FRAMEBUFFER_COMPLETE !== status0) {
          console.log('Framebuffer object is incomplete: ' + status.toString())
        }

        gl.viewport(0, 0, parentWidth, parentHeight)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        const projectionMatrix = m4.worldProjection(parentWidth, parentHeight)
        const viewMatrix = m4.multiply(projectionMatrix, localMatrix)
        this._drawer.draw(gl, viewMatrix, frameInfo, framebuffer0)

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, null, 0)
        gl.bindFramebuffer(gl.FRAMEBUFFER, parentFramebuffer || null)
      }

      gl.viewport(
        0,
        0,
        parentFramebuffer ? frameInfo.width : gl.canvas.width,
        parentFramebuffer ? frameInfo.height : gl.canvas.height,
      )

      // 绘制合并
      gl.uniformMatrix4fv(gl.uniforms.matrix, false, parentMatrix)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, framebuffer0.texture)

      gl.uniform1i(gl.uniforms.enableMask, 1)
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, framebuffer.texture)

      drawTexRectangle(gl, parentWidth, parentHeight, true)

      // 释放
      gl.bindTexture(gl.TEXTURE_2D, null)
      gl.bindFramebuffer(gl.FRAMEBUFFER, parentFramebuffer || null)
      gl.viewport(0, 0, parentWidth, parentHeight)
      gl.uniform1i(gl.uniforms.enableMask, 0)
    } else {
      const viewMatrix = m4.multiply(parentMatrix, localMatrix)
      this._drawer.draw(gl, viewMatrix, frameInfo, parentFramebuffer)
    }
  }

  destroy(gl?: ThisWebGLContext) {
    // if (this._t) {
    //   gl?.deleteFramebuffer(this._maskFramebuffer)
    //   gl?.deleteTexture(this._maskFramebuffer.texture)
    //   this._maskFramebuffer = undefined
    // }

    this._drawer?.destroy(gl)
  }
}