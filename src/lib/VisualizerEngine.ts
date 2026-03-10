import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

export type VizMode = 'sphere' | 'waveform' | 'bars' | 'tunnel' | 'galaxy' | 'fractals' | 'water' | 'texture' | 'melt'

export const MODE_INFO: Record<VizMode, { label: string; description: string }> = {
  sphere: { label: 'Sphere', description: '8k particle sphere with dynamic colors' },
  waveform: { label: 'Waveform', description: 'Real-time frequency waveform' },
  bars: { label: 'Bars', description: '128-bar circular spectrum analyzer' },
  tunnel: { label: 'Tunnel', description: 'Speed-reactive particle tunnel' },
  galaxy: { label: 'Galaxy', description: '5-armed spiral galaxy' },
  fractals: { label: 'Fractals', description: 'Recursive 3D octahedron forms' },
  water: { label: 'Water', description: 'Underwater shader environment' },
  texture: { label: 'Texture', description: 'Voronoi flowing colors' },
  melt: { label: 'Melt', description: 'Liquid distortion atmosphere' },
}

export class VisualizerEngine {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  composer: EffectComposer
  bloomPass: UnrealBloomPass
  clock = new THREE.Clock()
  visualObject: THREE.Object3D | null = null
  mode: VizMode = 'sphere'
  uniforms = {
    uTime: { value: 0 },
    uLevel: { value: 0 },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uBands: { value: new Float32Array(8) },
    uPulse: { value: 0 },
    uBandMul: { value: new Float32Array([1, 1, 1, 1, 1, 1, 1, 1]) },
  }
  targetBloomStrength = 0.8
  prevBands = new Array(8).fill(0)
  fps = 60
  frameCount = 0
  lastTime = performance.now()

  private getRenderSize() {
    const fullscreenEl = document.fullscreenElement as HTMLElement | null
    if (fullscreenEl) {
      const rect = fullscreenEl.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        return { w: Math.round(rect.width), h: Math.round(rect.height) }
      }
    }
    const canvasRect = this.renderer.domElement.getBoundingClientRect()
    if (canvasRect.width > 0 && canvasRect.height > 0) {
      return { w: Math.round(canvasRect.width), h: Math.round(canvasRect.height) }
    }
    return {
      w: this.renderer.domElement.clientWidth || document.documentElement.clientWidth || window.innerWidth,
      h: this.renderer.domElement.clientHeight || document.documentElement.clientHeight || window.innerHeight,
    }
  }

  constructor(canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const width = Math.round(rect.width) || canvas.clientWidth || document.documentElement.clientWidth || window.innerWidth
    const height = Math.round(rect.height) || canvas.clientHeight || document.documentElement.clientHeight || window.innerHeight

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.setSize(width, height, false)
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.autoClear = true

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x000000, 0.15)

    this.camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 100)
    this.camera.position.set(0, 0, 2.5)

    this.uniforms.uResolution.value.set(width, height)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.autoRotate = true
    this.controls.autoRotateSpeed = 0.3
    this.controls.enablePan = false
    this.controls.minDistance = 1
    this.controls.maxDistance = 10

    const size = new THREE.Vector2()
    this.renderer.getSize(size)
    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.bloomPass = new UnrealBloomPass(size, 0.8, 0.3, 0.1)
    this.composer.addPass(this.bloomPass)

    this.setMode('sphere')
    this._resizeHandler = () => this.onResize()
    window.addEventListener('resize', this._resizeHandler)
    window.visualViewport?.addEventListener('resize', this._resizeHandler)
  }

  private _resizeHandler = () => {}

  setMode(mode: VizMode) {
    this.mode = mode
    if (this.visualObject) {
      this.scene.remove(this.visualObject)
      this.disposeObject(this.visualObject)
    }

    this.scene.fog = new THREE.FogExp2(0x000000, 0.15)
    this.camera.position.set(0, 0, 2.5)
    this.controls.reset()

    const { w: width, h: height } = this.getRenderSize()
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.uniforms.uResolution.value.set(width, height)

    switch (mode) {
      case 'sphere': this.visualObject = this.makeSphere(); break
      case 'waveform': this.visualObject = this.makeWaveform(); break
      case 'bars': this.visualObject = this.makeBars(); break
      case 'tunnel': this.visualObject = this.makeTunnel(); break
      case 'galaxy': this.visualObject = this.makeGalaxy(); break
      case 'fractals': this.visualObject = this.makeFractals(); break
      case 'water': this.visualObject = this.makeWaterShader(); break
      case 'texture': this.visualObject = this.makeTextureShader(); break
      case 'melt': this.visualObject = this.makeMeltShader(); break
    }

    if (this.visualObject) this.scene.add(this.visualObject)
  }

  private disposeObject(obj: THREE.Object3D) {
    const mesh = obj as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    if (mesh.material) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      mats.forEach(m => m.dispose?.())
    }
    if ('children' in obj && Array.isArray(obj.children)) {
      obj.children.forEach((child: THREE.Object3D) => this.disposeObject(child))
    }
  }

  private makeSphere(): THREE.Points {
    const count = 8000
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const u = Math.random(), v = Math.random()
      const theta = u * Math.PI * 2
      const phi = Math.acos(2 * v - 1)
      const r = 0.8 + Math.random() * 0.3
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.cos(phi)
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
      seeds[i] = Math.random() * 100
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `
        uniform float uTime; uniform float uLevel;
        attribute float aSeed;
        varying float vAlpha; varying float vDist; varying float vLevel;
        float hash(float n) { return fract(sin(n) * 43758.5453); }
        void main() {
          vec3 p = position;
          float t = uTime * 0.8 + aSeed;
          float safeLevel = clamp(uLevel, 0.0, 1.0);
          float wob = (hash(t) * 2.0 - 1.0) * 0.01 * (1.0 + safeLevel);
          float inflate = 1.0 + safeLevel * 0.35;
          p *= inflate;
          p += normalize(p) * wob * (1.0 + uLevel);
          vDist = length(position); vAlpha = 0.3 + uLevel * 0.7; vLevel = uLevel;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float size = clamp((1.0 + safeLevel * 4.0) * (1.0 / -mv.z), 1.0, 24.0);
          gl_PointSize = size;
        }
      `,
      fragmentShader: `
        precision mediump float;
        varying float vAlpha; varying float vDist; varying float vLevel;
        void main() {
          vec2 uv = gl_PointCoord * 2.0 - 1.0;
          float d = dot(uv, uv);
          float m = smoothstep(1.0, 0.0, d);
          vec3 c1 = vec3(0.0, 1.0, 0.53);
          vec3 c2 = vec3(0.0, 0.8, 1.0);
          vec3 c3 = vec3(1.0, 0.3, 0.8);
          vec3 col = mix(c1, c2, vDist);
          col = mix(col, c3, vLevel * 0.5);
          gl_FragColor = vec4(col, m * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    return new THREE.Points(geo, material)
  }

  private makeWaveform(): THREE.Line {
    const geo = new THREE.BufferGeometry()
    const points = 512
    const positions = new Float32Array(points * 3)
    for (let i = 0; i < points; i++) {
      positions[i * 3] = (i / points - 0.5) * 8
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.LineBasicMaterial({ color: 0xff0888, linewidth: 3, transparent: true, opacity: 0.9 })
    return new THREE.Line(geo, material)
  }

  private makeBars(): THREE.Group {
    const group = new THREE.Group()
    const count = 128
    for (let i = 0; i < count; i++) {
      const geo = new THREE.BoxGeometry(0.04, 0.05, 0.04)
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(i / count, 0.9, 0.5),
        transparent: true,
        opacity: 0.9,
      })
      const mesh = new THREE.Mesh(geo, mat)
      const angle = (i / count) * Math.PI * 2
      mesh.position.set(Math.cos(angle) * 1.2, 0, Math.sin(angle) * 1.2)
      mesh.rotation.y = -angle
      group.add(mesh)
    }
    return group
  }

  private makeTunnel(): THREE.Points {
    const count = 30000
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const color = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const r = 0.8 + Math.random() * 0.6
      const z = (Math.random() - 0.5) * 15
      positions[i * 3] = Math.cos(theta) * r
      positions[i * 3 + 1] = Math.sin(theta) * r
      positions[i * 3 + 2] = z
      const t = Math.abs(z) / 15
      color.lerpColors(
        new THREE.Color(0x00ff88),
        new THREE.Color(0xff00ff),
        t
      )
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const mat = new THREE.PointsMaterial({
      size: 0.04,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    })
    return new THREE.Points(geo, mat)
  }

  private makeGalaxy(): THREE.Points {
    const count = 80000
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const color = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 4 * 0.5
      const spiral = (i % 5) / 5 * Math.PI * 2 + radius * 3
      const x = Math.cos(spiral) * radius + (Math.pow(Math.random(), 3) - 0.5) * 0.3 * 0.5
      const y = (Math.pow(Math.random(), 3) - 0.5) * 0.3 * 0.5
      const z = Math.sin(spiral) * radius + (Math.pow(Math.random(), 3) - 0.5) * 0.3 * 0.5
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
      color.lerpColors(new THREE.Color(0x00ff88), new THREE.Color(0xff00ff), radius / 2)
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const mat = new THREE.PointsMaterial({
      size: 0.015,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })
    return new THREE.Points(geo, mat)
  }

  private makeFractals(): THREE.Group {
    const group = new THREE.Group()
    const iter = (depth: number, size: number, pos: THREE.Vector3) => {
      const geo = new THREE.OctahedronGeometry(size, 0)
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(depth / 3, 0.8, 0.5),
        wireframe: true,
        transparent: true,
        opacity: 0.6,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(pos)
      group.add(mesh)
      if (depth > 0) {
        const s = size * 0.5
        ;[[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0]].forEach(([dx, dy, dz]) => {
          iter(depth - 1, s, pos.clone().add(new THREE.Vector3(dx, dy, dz).multiplyScalar(s * 0.6)))
        })
      }
    }
    iter(3, 1.5, new THREE.Vector3(0, 0, 0))
    return group
  }

  private makeWaterShader(): THREE.Mesh {
    const geo = new THREE.SphereGeometry(1.2, 64, 64)
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `
        uniform float uTime; uniform float uLevel; uniform float uBands[8];
        varying vec2 vUv; varying vec3 vPosition;
        void main() {
          vUv = uv;
          float sag = sin(position.y * 4.0 + uTime * 1.5) * (0.002 + uLevel * 0.002);
          vec3 pos = position + normal * sag;
          vPosition = pos;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime; uniform float uLevel;
        varying vec2 vUv; varying vec3 vPosition;
        void main() {
          float t = uTime * 0.3;
          float stripe = smoothstep(0.2, 0.6, fract(vUv.y * 10.0 + t));
          vec3 col = mix(vec3(0.0, 0.4, 0.6), vec3(0.0, 0.6, 0.8), stripe);
          col += vec3(0.2, 0.3, 0.4) * uLevel;
          float vig = smoothstep(1.1, 0.2, length(vUv - 0.5));
          gl_FragColor = vec4(col * vig, 0.9);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    })
    return new THREE.Mesh(geo, mat)
  }

  private makeTextureShader(): THREE.Mesh {
    const geo = new THREE.SphereGeometry(1.2, 64, 64)
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `
        uniform float uTime; uniform float uLevel;
        varying vec2 vUv; varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime; uniform float uLevel;
        varying vec2 vUv; varying vec3 vPosition;
        void main() {
          float t = uTime * 0.2;
          vec2 p = vUv * 8.0 + t;
          float n = sin(p.x) * sin(p.y) * 0.5 + 0.5;
          vec3 col = mix(vec3(0.4, 0.1, 0.5), vec3(0.8, 0.2, 0.6), n);
          col *= 1.0 + uLevel * 0.5;
          float vig = smoothstep(1.1, 0.2, length(vUv - 0.5));
          gl_FragColor = vec4(col * vig, 0.9);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    })
    return new THREE.Mesh(geo, mat)
  }

  private makeMeltShader(): THREE.Mesh {
    const geo = new THREE.SphereGeometry(1.2, 64, 64)
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `
        uniform float uTime; uniform float uLevel; uniform float uBands[8];
        varying vec2 vUv; varying vec3 vPosition; varying float vLowMid;
        void main() {
          vUv = uv;
          float lowMid = (uBands[1] + uBands[2]) * 0.9;
          vLowMid = lowMid;
          float sag = sin(position.y * 4.0 + uTime * 1.5) * (0.002 + uLevel * 0.002 + lowMid * 0.001);
          vec3 pos = position + normal * sag;
          vPosition = pos;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime; uniform float uLevel;
        varying vec2 vUv; varying float vLowMid;
        void main() {
          float t = uTime * 0.3;
          float stripe = smoothstep(0.2, 0.6, fract(vUv.y * 10.0 + t));
          vec3 col = mix(vec3(1.0, 0.45, 0.25), vec3(0.9, 0.15, 0.6), stripe);
          float glow = uLevel * 1.2 + vLowMid * 1.6;
          col += vec3(0.3, 0.15, 0.07) * glow;
          col *= 1.0 + uLevel * 0.9 + vLowMid * 0.8;
          float vig = smoothstep(1.1, 0.2, length(vUv - 0.5));
          gl_FragColor = vec4(col * vig, 1.0);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    })
    return new THREE.Mesh(geo, mat)
  }

  update(level: number, frequencyData?: Uint8Array) {
    const dt = this.clock.getDelta()
    this.uniforms.uTime.value += dt * 2
    this.uniforms.uLevel.value = Math.min(1, level * 1.5)

    if (frequencyData && frequencyData.length > 0) {
      const bands = this.uniforms.uBands.value
      bands.fill(0)
      for (let i = 0; i < 8; i++) {
        const start = Math.pow(2, i) - 1
        const end = Math.min(frequencyData.length - 1, Math.pow(2, i + 1) - 1)
        let sum = 0, n = 0
        for (let j = start; j <= end; j++) {
          sum += frequencyData[j] || 0
          n++
        }
        bands[i] = n > 0 ? sum / n / 255 : 0
      }
    }

    this.bloomPass.strength = THREE.MathUtils.lerp(this.bloomPass.strength || 0, this.targetBloomStrength, 0.1)

    const mesh = this.visualObject
    if (mesh) {
      if ('isLine' in mesh && mesh.isLine) {
        const attrs = (mesh as THREE.Line).geometry.attributes
        if (attrs.position && frequencyData) {
          const arr = attrs.position.array as Float32Array
          for (let i = 0; i < arr.length / 3; i++) {
            arr[i * 3 + 1] = (frequencyData[i * 2] || 0) / 255 * 3 - 1.5
          }
          attrs.position.needsUpdate = true
        }
      } else if ('isGroup' in mesh && mesh.isGroup) {
        const children = (mesh as THREE.Group).children as THREE.Mesh[]
        children.forEach((bar, i) => {
          const h = frequencyData ? (frequencyData[Math.floor(i * frequencyData.length / children.length)] || 0) / 255 * 4 + 0.05 : 0.05
          bar.scale.y = h
          bar.position.y = h / 2
          if (bar.material && 'color' in bar.material) {
            (bar.material as THREE.MeshBasicMaterial).color.setHSL((i / children.length + level * 0.2) % 1, 0.9, 0.5)
          }
        })
      } else if ('rotation' in mesh) {
        mesh.rotation.y += dt * 0.1 * (1 + level)
        mesh.rotation.x += dt * 0.05 * level
      }
    }

    this.controls.update()
    this.composer.render()

    this.frameCount++
    if (performance.now() - this.lastTime >= 1000) {
      this.fps = Math.round(this.frameCount * 1000 / (performance.now() - this.lastTime))
      this.frameCount = 0
      this.lastTime = performance.now()
    }
  }

  onResize() {
    const { w, h } = this.getRenderSize()
    if (w <= 0 || h <= 0) return
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.renderer.setPixelRatio(dpr)
    this.renderer.setSize(w, h, false)
    this.uniforms.uResolution.value.set(w, h)
    this.composer.setPixelRatio(dpr)
    this.composer.setSize(w, h)
    this.composer.render()
  }

  dispose() {
    window.removeEventListener('resize', this._resizeHandler)
    window.visualViewport?.removeEventListener('resize', this._resizeHandler)
    if (this.visualObject) this.disposeObject(this.visualObject)
    this.renderer.dispose()
  }
}
