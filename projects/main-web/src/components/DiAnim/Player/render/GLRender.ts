import DiLayer, {FragmenShader, VertexShader} from '../layers/Layer'
import {makeLayer} from '../layers/makes'
import {DiFrameInfo, DiLayerProps} from '../types'
import {createProgram, resizeCanvasToDisplaySize} from '../utils/glutils'
import * as m4 from '../utils/m4'
import {DiWebGLRenderingContext} from '../utils/types'

function makeCameraMatrix(width: number, height: number) {
  // 透视矩阵
  const fieldOfViewRadians = m4.degToRad(90)
  const aspect = width / height
  const zNear = 1
  const zFar = 2000
  const projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar)
  // 相机坐标矩阵
  const cameraPosition = [0, 0, height * 0.5 + 1]
  const target = [0, 0, 0]
  const up = [0, 1, 0]
  const cameraMatrix = m4.lookAt(cameraPosition, target, up)
  // 当前视图矩阵
  const viewMatrix = m4.inverse(cameraMatrix)
  const viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix)

  return viewProjectionMatrix
}

export default class DiGLRender {
  private container?: HTMLElement
  private canvas?: HTMLCanvasElement
  private gl?: DiWebGLRenderingContext

  private viewProjectionMatrix = m4.identity()
  private layers?: DiLayer[]

  setContainer(container: HTMLElement) {
    if (this.container === container) return
    this.container = container

    if (this.canvas) {
      this.canvas.parentNode?.removeChild(this.canvas)
      this.container.appendChild(this.canvas)
    }
  }

  setRenderInfo(width: number, height: number, layerPropss: DiLayerProps[]) {
    if (!this.canvas) {
      const canvas = (this.canvas = document.createElement('canvas'))
      canvas.width = width
      canvas.height = height

      this.gl = canvas.getContext('webgl') as DiWebGLRenderingContext
      this.container?.appendChild(this.canvas)

      this.initGL()
    }

    if (!this.gl) {
      throw `DiGLRender, getContext('webgl') is null`
    }

    resizeCanvasToDisplaySize(this.canvas)

    this.viewProjectionMatrix = makeCameraMatrix(width, height)

    this.loadLayers(layerPropss)
  }

  render(frameInfo: DiFrameInfo) {
    const gl = this.gl
    if (!gl) return

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.enable(gl.BLEND)
    gl.enable(gl.CULL_FACE)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    this.layers?.forEach(layer => {
      layer.render(gl, this.viewProjectionMatrix, frameInfo)
    })
  }

  clear() {
    const {gl, canvas} = this

    this.layers?.forEach(layer => layer.clear(gl))
    this.layers = undefined

    canvas?.parentNode && canvas.parentNode.removeChild(canvas)
    this.canvas = undefined
  }

  private initGL() {
    const {gl, canvas} = this
    if (!gl || !canvas) return

    const program = (gl.program = createProgram(gl, VertexShader, FragmenShader))
    if (program) {
      // 设置参数
      gl.attribs = {
        position: gl.getAttribLocation(program, 'a_position'),
        texcoord: gl.getAttribLocation(program, 'a_texcoord'),
      }
      gl.uniforms = {
        matrix: gl.getUniformLocation(program, 'u_matrix') as WebGLUniformLocation,
        texMatrix: gl.getUniformLocation(program, 'u_texMatrix') as WebGLUniformLocation,
      }
    }
  }

  private loadLayers(layerPropss: DiLayerProps[]) {
    this.layers = []

    // 初始化layers
    for (let i = 0, l = layerPropss.length; i < l; i++) {
      const layer = makeLayer(layerPropss[i])
      if (layer) {
        this.layers.push(layer)
      }
    }

    if (this.gl) {
      for (let i = 0; i < this.layers.length; i++) {
        this.layers[i].init(this.gl)
      }
    }
  }
}
