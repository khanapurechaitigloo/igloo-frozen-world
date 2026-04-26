import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { BEERS, COTTAGE_STYLES } from './beerData.js'

export class World {
  constructor(container) {
    this.container = container
    this.selectedBeer = null
    this.selectCallback = null
    this.cottages = {} // beerId → { group, glowMesh, style }
    this.clock = new THREE.Clock()

    this._initRenderer()
    this._initScene()
    this._initCamera()
    this._initControls()
    this._initLights()
    this._buildSky()
    this._buildTerrain()
    this._buildIgloo()
    this._buildCottages()
    this._buildTrees()
    this._buildLanterns()
    this._buildBarrels()
    this._buildPaths()
    this._buildStringLights()
    this._buildSnowfall()
    this._initRaycaster()

    this._animate = this._animate.bind(this)
    this._animate()
  }

  onSelect(cb) { this.selectCallback = cb }

  deselect() {
    this.selectedBeer = null
    Object.values(this.cottages).forEach(c => { c.selected = false })
  }

  startAudio() { /* placeholder — skip audio for now */ }

  // ── Renderer ──
  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 0.9
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.container.appendChild(this.renderer.domElement)
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    })
  }

  // ── Scene ──
  _initScene() {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0a0c1a)
    this.scene.fog = new THREE.FogExp2(0x0a0c1a, 0.015)
  }

  // ── Camera ──
  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200)
    this.camera.position.set(0, 15, 25)
    this.camera.lookAt(0, 0, 0)
  }

  // ── Controls ──
  _initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.maxPolarAngle = Math.PI / 2.2
    this.controls.minPolarAngle = 0.2
    this.controls.minDistance = 8
    this.controls.maxDistance = 50
    this.controls.target.set(0, 0, 0)
  }

  // ── Lights ──
  _initLights() {
    // Dim ambient — aurora will provide most fill
    const ambient = new THREE.AmbientLight(0x1a2040, 0.4)
    this.scene.add(ambient)

    // Key light — cool moonlight from above-left
    const key = new THREE.DirectionalLight(0x8090c0, 0.6)
    key.position.set(-8, 15, 5)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.near = 1
    key.shadow.camera.far = 40
    key.shadow.camera.left = -20
    key.shadow.camera.right = 20
    key.shadow.camera.top = 20
    key.shadow.camera.bottom = -20
    this.scene.add(key)

    // Subtle rim light from the right — aurora reflection
    const rim = new THREE.DirectionalLight(0x306040, 0.15)
    rim.position.set(5, 10, -8)
    this.scene.add(rim)

    // Hemisphere — snow ground bounce
    const hemi = new THREE.HemisphereLight(0x203050, 0x404860, 0.3)
    this.scene.add(hemi)
  }

  // ── Aurora Sky Dome ──
  _buildSky() {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `
    const fragmentShader = `
      precision mediump float;
      uniform float uTime;
      varying vec2 vUv;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
                   mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
      }
      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
        return v;
      }

      void main() {
        float t = uTime * 0.2;
        float y = vUv.y;

        // Deep sky gradient
        vec3 sky = mix(vec3(0.04, 0.03, 0.10), vec3(0.01, 0.01, 0.05), y);
        // Horizon glow
        float horizonGlow = smoothstep(0.0, 0.3, y) * smoothstep(0.5, 0.2, y);
        sky += vec3(0.02, 0.01, 0.04) * horizonGlow;

        // Stars — use cylindrical mapping for seamless wrap
        float starAngle = vUv.x * 6.2832;
        vec2 starUv = vec2(cos(starAngle), sin(starAngle)) + vUv.y;
        float stars = step(0.997, hash(floor(starUv * 400.0)));
        float twinkle = 0.5 + 0.5 * sin(t * 3.0 + hash(floor(starUv * 400.0)) * 100.0);
        sky += stars * twinkle * 0.5;

        // Aurora bands — 5 distinct curtains
        vec3 aurora = vec3(0.0);
        for (int i = 0; i < 5; i++) {
          float fi = float(i);
          float bandY = 0.32 + fi * 0.05;
          float thickness = 0.06 + fi * 0.01;
          float drift = sin(t * 0.3 + fi * 1.2) * 0.1;
          // Map UV.x to a cylinder angle → sample noise on a torus → seamless wrap
          float angle = vUv.x * 6.2832;  // 0..2π
          float cx = cos(angle);
          float cy = sin(angle);
          float warp = fbm(vec2(cx * 2.0 + t * 0.1 + fi * 0.5, cy * 2.0 + vUv.y * 1.5)) * 0.15;
          float curtain = smoothstep(bandY - thickness, bandY, vUv.y + warp + drift)
                        * smoothstep(bandY + thickness, bandY, vUv.y + warp + drift);
          float n = fbm(vec2(cx * 3.0 + t * 0.2 + fi, cy * 3.0 + vUv.y * 2.0 + t * 0.1));
          curtain *= n;

          // Color shift per band — greens, teals, magentas
          vec3 col1 = vec3(0.1, 0.8, 0.3);
          vec3 col2 = mix(vec3(0.05, 0.5, 0.5), vec3(0.3, 0.2, 0.6), fi / 4.0);
          aurora += mix(col1, col2, n) * curtain * 1.5;
        }

        float pulse = 0.7 + sin(t * 1.5) * 0.3;
        aurora *= pulse;

        gl_FragColor = vec4(sky + aurora, 1.0);
      }
    `
    const geo = new THREE.SphereGeometry(80, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55)
    const mat = new THREE.ShaderMaterial({
      vertexShader, fragmentShader,
      uniforms: { uTime: { value: 0 } },
      side: THREE.BackSide,
    })
    this.auroraMat = mat
    this.scene.add(new THREE.Mesh(geo, mat))
  }

  // ── Snowy Terrain ──
  _buildTerrain() {
    const size = 60, segments = 128
    const geo = new THREE.PlaneGeometry(size, size, segments, segments)
    geo.rotateX(-Math.PI / 2)

    const pos = geo.attributes.position
    const colors = new Float32Array(pos.count * 3)

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i)
      const h = Math.sin(x * 0.15) * Math.cos(z * 0.12) * 1.2
              + Math.sin(x * 0.4 + 1.3) * Math.cos(z * 0.35 + 0.7) * 0.5
              + Math.sin(x * 0.9 + 2.1) * Math.cos(z * 0.8 + 1.1) * 0.15
              + Math.sin(x * 1.8 + 0.5) * Math.cos(z * 1.6 + 0.3) * 0.05
      const d = Math.sqrt(x * x + z * z)
      const flatten = smoothstep(8, 15, d)
      pos.setY(i, h * flatten)

      const shade = 0.88 + Math.sin(x * 0.6 + z * 0.4) * 0.05 + Math.random() * 0.04
      colors[i * 3] = shade
      colors[i * 3 + 1] = shade * 1.02
      colors[i * 3 + 2] = shade + 0.04
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.computeVertexNormals()

    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0.02 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.receiveShadow = true
    this.scene.add(mesh)
  }

  // ── Main Igloo Brewery ──
  _buildIgloo() {
    const g = new THREE.Group()
    g.position.set(0, 0, 0)

    // Dome — icosahedron for organic shape
    const domeGeo = new THREE.IcosahedronGeometry(2.5, 2)
    const domeMat = new THREE.MeshStandardMaterial({ color: 0xe8e0d8, roughness: 0.8, metalness: 0, flatShading: true })
    const dome = new THREE.Mesh(domeGeo, domeMat)
    dome.position.y = 1.2
    dome.castShadow = true
    g.add(dome)

    // Snow patches
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf5f0ef, roughness: 0.95, metalness: 0, flatShading: true })
    const patches = [[0, 2.8, 0.5, 0.6], [-0.8, 2.5, -0.3, 0.4], [0.6, 2.6, -0.6, 0.35]]
    patches.forEach(([x, y, z, r]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 6, 4), snowMat)
      m.position.set(x, y, z)
      g.add(m)
    })

    // Door frame
    const doorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 1.4, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x3a2510, roughness: 0.7, metalness: 0.1 })
    )
    doorFrame.position.set(0, 0.8, 2.3)
    g.add(doorFrame)

    // Warm door glow
    const doorGlow = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 1.1, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xf0a040, emissive: 0xf0a040, emissiveIntensity: 0.6, transparent: true, opacity: 0.8 })
    )
    doorGlow.position.set(0, 0.8, 2.25)
    this.doorGlow = doorGlow
    g.add(doorGlow)

    // Door light
    const doorLight = new THREE.PointLight(0xf0a040, 3, 6)
    doorLight.position.set(0, 1.0, 2.8)
    g.add(doorLight)

    // Chimney
    const chimney = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.18, 0.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x6b5b4f, roughness: 0.85, metalness: 0 })
    )
    chimney.position.set(1.0, 3.2, -0.5)
    chimney.castShadow = true
    g.add(chimney)

    // Smoke particles
    this.smokeParticles = []
    for (let i = 0; i < 12; i++) {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(1, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xa8a098, transparent: true, opacity: 0.45, depthWrite: false, emissive: 0x888078, emissiveIntensity: 0.3 })
      )
      s.userData = { offset: i * 0.3, speed: 0.2 + Math.random() * 0.15, xOff: (Math.random() - 0.5) * 0.5, scale: 0.15 + Math.random() * 0.1 }
      s.position.set(1.0, 3.8, -0.5)
      g.add(s)
      this.smokeParticles.push(s)
    }

    this.scene.add(g)
  }

  // ── Beer Cottages ──
  _buildCottages() {
    BEERS.forEach(beer => {
      const style = COTTAGE_STYLES[beer.id]
      const g = new THREE.Group()
      g.position.set(beer.x, 0, beer.z)

      const { wallColor, roofColor, trimColor, windowColor, roofPitch, width, depth, wallHeight } = style

      // Foundation
      g.add(this._box(width + 0.1, 0.1, depth + 0.1, 0x5a5048, [0, 0.05, 0], { roughness: 0.95, flatShading: true }))

      // Walls
      const walls = this._box(width, wallHeight, depth, wallColor, [0, wallHeight * 0.5 + 0.1, 0], { roughness: 0.85, flatShading: true })
      walls.castShadow = true
      g.add(walls)

      // Trim beams
      g.add(this._box(width + 0.06, 0.06, depth + 0.06, trimColor, [0, wallHeight + 0.1, 0]))
      g.add(this._box(width + 0.04, 0.04, depth + 0.04, trimColor, [0, 0.15, 0]))

      // A-frame roof — built as an extruded triangle cross-section
      const roofShape = new THREE.Shape()
      const halfW = width * 0.5 + 0.15  // overhang
      roofShape.moveTo(-halfW, 0)        // left eave
      roofShape.lineTo(halfW, 0)         // right eave
      roofShape.lineTo(0, roofPitch)     // peak
      roofShape.closePath()
      const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
        depth: depth + 0.3,
        bevelEnabled: false,
      })
      roofGeo.translate(0, 0, -(depth + 0.3) * 0.5)  // center along Z
      const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.9, metalness: 0, flatShading: true })
      const roofMesh = new THREE.Mesh(roofGeo, roofMat)
      roofMesh.position.y = wallHeight + 0.1
      roofMesh.castShadow = true
      g.add(roofMesh)

      // Snow on roof ridge
      const snowY = wallHeight + 0.1 + roofPitch * 0.55
      g.add(this._box(width * 0.3, 0.08, depth * 0.6, 0xf5f0ef, [0, snowY + 0.06, 0]))
      g.add(this._box(width * 0.25, 0.06, depth * 0.4, 0xf0ebe8, [-width * 0.15, snowY - 0.05, 0]))

      // Door
      g.add(this._box(0.36, 0.66, 0.01, trimColor, [0, 0.35, depth * 0.5 + 0.02]))
      g.add(this._box(0.3, 0.6, 0.03, 0x3a2510, [0, 0.35, depth * 0.5 + 0.01]))
      // Door knob
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), new THREE.MeshStandardMaterial({ color: 0xc0a030, roughness: 0.3, metalness: 0.7 }))
      knob.position.set(0.1, 0.35, depth * 0.5 + 0.03)
      g.add(knob)

      // Windows with glow
      const glowMesh = this._addWindow(g, [-width * 0.3, 0.55, depth * 0.5 + 0.01], [0, 0, 0], windowColor, true)
      this._addWindow(g, [width * 0.3, 0.55, depth * 0.5 + 0.01], [0, 0, 0], windowColor, false)
      this._addWindow(g, [width * 0.5 + 0.01, 0.55, 0.3], [0, Math.PI / 2, 0], windowColor, false)
      this._addWindow(g, [-width * 0.5 - 0.01, 0.55, -0.3], [0, Math.PI / 2, 0], windowColor, false)

      // Chimney
      const chimY = wallHeight + roofPitch * 0.5 + 0.3
      g.add(this._box(0.15, 0.5, 0.15, 0x6b5040, [width * 0.3, chimY, -depth * 0.2], { flatShading: true }))
      g.add(this._box(0.2, 0.05, 0.2, 0x5a4535, [width * 0.3, chimY + 0.28, -depth * 0.2]))

      // Interior glow light
      const interiorLight = new THREE.PointLight(windowColor, 2, 5)
      interiorLight.position.set(0, wallHeight * 0.5, depth * 0.3)
      g.add(interiorLight)

      // Snow piles at base
      const pileMat = new THREE.MeshStandardMaterial({ color: 0xf0ebe8, roughness: 0.95, metalness: 0 })
      const p1 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 4), pileMat)
      p1.position.set(width * 0.5 + 0.15, 0.08, 0)
      g.add(p1)
      const p2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), pileMat)
      p2.position.set(-width * 0.5 - 0.1, 0.06, 0.3)
      g.add(p2)

      // Sign post
      this._addSignPost(g, beer, width)

      // Store cottage ref for animation
      g.userData = { beerId: beer.id }
      this.cottages[beer.id] = { group: g, glowMesh, interiorLight, style, selected: false }

      // Raycaster target — invisible clickable box
      const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(width + 0.5, 2, depth + 0.5),
        new THREE.MeshBasicMaterial({ visible: false })
      )
      hitbox.position.y = 1
      hitbox.userData = { beerId: beer.id, type: 'cottage' }
      g.add(hitbox)

      this.scene.add(g)
    })
  }

  _addWindow(parent, pos, rot, color, withGlow) {
    const wg = new THREE.Group()
    wg.position.set(...pos)
    wg.rotation.set(...rot)
    // Frame
    wg.add(this._box(0.22, 0.22, 0.02, 0x3a3028))
    // Glow pane
    const pane = this._box(0.18, 0.18, 0.025, color, [0, 0, 0.003], { emissive: color, emissiveIntensity: 0.7, transparent: true, opacity: 0.9 })
    wg.add(pane)
    // Cross dividers
    wg.add(this._box(0.19, 0.015, 0.005, 0x3a3028, [0, 0, 0.015]))
    wg.add(this._box(0.015, 0.19, 0.005, 0x3a3028, [0, 0, 0.015]))
    parent.add(wg)
    return withGlow ? pane : null
  }

  _addSignPost(parent, beer, width) {
    const sg = new THREE.Group()
    sg.position.set(width * 0.5 + 0.3, 0, 0.3)
    // Post
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.03, 1.0, 6),
      new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.85 })
    )
    post.position.y = 0.5
    post.castShadow = true
    sg.add(post)
    // Sign board
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.22, 0.04),
      new THREE.MeshStandardMaterial({ color: 0xd4b896, roughness: 0.85 })
    )
    board.position.set(0.2, 0.5, 0)
    board.rotation.z = -0.08
    board.castShadow = true
    sg.add(board)
    // Accent stripe
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.03, 0.005),
      new THREE.MeshStandardMaterial({ color: beer.glow, emissive: beer.glow, emissiveIntensity: 0.3 })
    )
    stripe.position.set(0.2, 0.5, 0.025)
    stripe.rotation.z = -0.08
    sg.add(stripe)
    parent.add(sg)
  }

  // ── Trees ──
  _buildTrees() {
    const treeMat1 = new THREE.MeshStandardMaterial({ color: 0x1a3a1a, roughness: 0.85, flatShading: true })
    const treeMat2 = new THREE.MeshStandardMaterial({ color: 0x2a4a2a, roughness: 0.85, flatShading: true })
    const treeMat3 = new THREE.MeshStandardMaterial({ color: 0x3a5a3a, roughness: 0.85, flatShading: true })
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.9 })
    const snowMat = new THREE.MeshStandardMaterial({ color: 0xf0ebe8, roughness: 0.9 })

    const positions = [
      [-8, 0, -6], [-10, 0, -2], [-7, 0, 2], [-9, 0, 6],
      [8, 0, -6], [10, 0, -1], [7, 0, 3], [9, 0, 7],
      [-3, 0, -10], [3, 0, -10], [-12, 0, 0], [12, 0, 0],
      [-4, 0, 8], [4, 0, 8], [-11, 0, -4], [11, 0, 4],
    ]

    positions.forEach(([x, , z]) => {
      const scale = 0.8 + Math.random() * 0.5
      const tg = new THREE.Group()
      tg.position.set(x, 0, z)
      tg.scale.setScalar(scale)

      // Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.4, 6), trunkMat)
      trunk.position.y = 0.2
      trunk.castShadow = true
      tg.add(trunk)

      // Three foliage layers
      const mats = [treeMat1, treeMat2, treeMat3]
      const sizes = [0.4, 0.3, 0.2]
      const heights = [0.5, 0.9, 1.2]

      heights.forEach((y, i) => {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(sizes[i], 0.5, 8), mats[i])
        cone.position.y = y
        cone.castShadow = true
        tg.add(cone)

        // Snow cap on each layer
        const snow = new THREE.Mesh(new THREE.ConeGeometry(0.15 - i * 0.03, 0.1, 6), snowMat)
        snow.position.y = y + 0.2
        tg.add(snow)
      })

      // Snow ball on top
      const top = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), snowMat)
      top.position.y = 1.5
      tg.add(top)

      this.scene.add(tg)
    })
  }

  // ── Lanterns ──
  _buildLanterns() {
    this.lanternLights = []
    const positions = [
      [-3, 0, -1], [3, 0, -1], [-1, 0, 3], [1, 0, 3],
      [-7, 0, 0], [7, 0, 0], [0, 0, -5], [0, 0, 6],
    ]

    positions.forEach(([x, , z]) => {
      const lg = new THREE.Group()
      lg.position.set(x, 0, z)

      // Post
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 1.0, 4),
        new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 0.9 })
      )
      post.position.y = 0.5
      post.castShadow = true
      lg.add(post)

      // Housing
      const housing = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.12, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x2a2520, roughness: 0.7, metalness: 0.3 })
      )
      housing.position.y = 0.55
      housing.castShadow = true
      lg.add(housing)

      // Glow orb
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 8, 8),
        new THREE.MeshStandardMaterial({ color: 0xf0a040, emissive: 0xf0a040, emissiveIntensity: 1.0, transparent: true, opacity: 0.8 })
      )
      orb.position.y = 0.55
      lg.add(orb)

      // Point light
      const light = new THREE.PointLight(0xf0a040, 1.2, 3)
      light.position.y = 0.55
      lg.add(light)
      this.lanternLights.push(light)

      this.scene.add(lg)
    })
  }

  // ── Barrels ──
  _buildBarrels() {
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x5a3a20, roughness: 0.85 })
    const bandMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.4, metalness: 0.6 })

    const barrels = [
      [-1.5, 0, 2, 0], [-1.2, 0, 2.5, 0.3], [2, 0, 1, -0.5],
      [1.8, 0, 1.4, 0.8], [-8, 0, -4, 0], [8, 0, -4, 0],
    ]

    barrels.forEach(([x, , z, rot]) => {
      const bg = new THREE.Group()
      bg.position.set(x, 0, z)
      bg.rotation.y = rot

      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.3, 10), barrelMat)
      body.castShadow = true
      bg.add(body)

      // Metal bands
      const band1 = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.008, 4, 12), bandMat)
      band1.position.y = 0.06
      bg.add(band1)
      const band2 = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.008, 4, 12), bandMat)
      band2.position.y = -0.06
      bg.add(band2)

      this.scene.add(bg)
    })
  }

  // ── Snow Paths ──
  _buildPaths() {
    const pathMat = new THREE.MeshStandardMaterial({ color: 0xd8d2cc, roughness: 0.95, transparent: true, opacity: 0.5 })
    const connections = [
      [[0, 0, 0], [-6, 0, -3]],
      [[0, 0, 0], [6, 0, -3]],
      [[0, 0, 0], [0, 0, -8]],
      [[0, 0, 0], [-5, 0, 5]],
      [[0, 0, 0], [5, 0, 5]],
    ]

    connections.forEach(([from, to]) => {
      const dx = to[0] - from[0], dz = to[2] - from[2]
      const len = Math.sqrt(dx * dx + dz * dz)
      const geo = new THREE.PlaneGeometry(0.4, len, 1, 8)
      geo.rotateX(-Math.PI / 2)
      const mesh = new THREE.Mesh(geo, pathMat)
      mesh.position.set((from[0] + to[0]) / 2, 0.01, (from[2] + to[2]) / 2)
      mesh.rotation.y = Math.atan2(dx, dz)
      this.scene.add(mesh)
    })
  }

  // ── String Lights ──
  _buildStringLights() {
    this.stringLightMeshes = []
    const strings = [
      { from: [-4, 2, -1], to: [4, 2, -1], color: 0xf0c060 },
      { from: [-2, 1.8, 3], to: [2, 1.8, 3], color: 0xe06050 },
      { from: [-6, 2.2, -5], to: [0, 2.2, -7], color: 0x60c0f0 },
      { from: [0, 2.2, -7], to: [6, 2.2, -5], color: 0x60c0f0 },
    ]

    strings.forEach(({ from, to, color }) => {
      const count = 8, droop = 0.6
      const positions = []
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1)
        positions.push(new THREE.Vector3(
          from[0] + (to[0] - from[0]) * t,
          from[1] + (to[1] - from[1]) * t - Math.sin(t * Math.PI) * droop,
          from[2] + (to[2] - from[2]) * t,
        ))
      }

      // Wire
      const wireGeo = new THREE.BufferGeometry().setFromPoints(positions)
      const wire = new THREE.Line(wireGeo, new THREE.LineBasicMaterial({ color: 0x3a3028, transparent: true, opacity: 0.6 }))
      this.scene.add(wire)

      // Bulbs
      const bulbGeo = new THREE.SphereGeometry(0.04, 8, 8)
      const bulbMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8, transparent: true, opacity: 0.9 })
      positions.forEach(pos => {
        const bulb = new THREE.Mesh(bulbGeo, bulbMat.clone())
        bulb.position.copy(pos)
        this.scene.add(bulb)
        this.stringLightMeshes.push(bulb)
      })

      // Warm point light at center
      const mid = positions[Math.floor(count / 2)]
      const light = new THREE.PointLight(color, 0.5, 3)
      light.position.copy(mid)
      this.scene.add(light)
    })
  }

  // ── Snowfall ──
  _buildSnowfall() {
    const count = 2000, area = 40, height = 15
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * area
      positions[i * 3 + 1] = Math.random() * height
      positions[i * 3 + 2] = (Math.random() - 0.5) * area
      velocities[i * 3] = (Math.random() - 0.5) * 0.02
      velocities[i * 3 + 1] = -(0.01 + Math.random() * 0.03)
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02
    }

    // Particle texture
    const canvas = document.createElement('canvas')
    canvas.width = 32; canvas.height = 32
    const ctx = canvas.getContext('2d')
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.4, 'rgba(240,245,255,0.8)')
    grad.addColorStop(1, 'rgba(230,235,250,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 32, 32)
    const tex = new THREE.CanvasTexture(canvas)

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const mat = new THREE.PointsMaterial({
      size: 0.08, map: tex, transparent: true, opacity: 0.7,
      depthWrite: false, blending: THREE.AdditiveBlending, color: 0xe8eef5, sizeAttenuation: true,
    })

    this.snowPoints = new THREE.Points(geo, mat)
    this.snowVelocities = velocities
    this.snowCount = count
    this.snowArea = area
    this.snowHeight = height
    this.scene.add(this.snowPoints)
  }

  // ── Raycaster ──
  _initRaycaster() {
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    this.renderer.domElement.addEventListener('click', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
      this.raycaster.setFromCamera(this.mouse, this.camera)

      // Collect all clickable meshes
      const targets = []
      Object.values(this.cottages).forEach(c => {
        c.group.traverse(child => {
          if (child.userData?.type === 'cottage') targets.push(child)
        })
      })

      const hits = this.raycaster.intersectObjects(targets)
      if (hits.length > 0) {
        const beerId = hits[0].object.userData.beerId
        this.selectedBeer = beerId
        Object.entries(this.cottages).forEach(([id, c]) => { c.selected = id === beerId })
        this.selectCallback?.(beerId)
      }
    })
  }

  // ── Animation Loop ──
  _animate() {
    requestAnimationFrame(this._animate)
    const t = this.clock.getElapsedTime()

    // Aurora
    this.auroraMat.uniforms.uTime.value = t

    // Door glow pulse
    if (this.doorGlow) {
      this.doorGlow.material.emissiveIntensity = 0.8 + Math.sin(t * 2) * 0.15
    }

    // Smoke
    this.smokeParticles.forEach(s => {
      const d = s.userData
      const cycle = ((t * d.speed + d.offset) % 4) / 4
      s.position.y = 3.8 + cycle * 3.0
      s.position.x = 1.0 + d.xOff + Math.sin(t * 0.5 + d.offset) * 0.2
      const sc = d.scale * (1 + cycle * 4)
      s.scale.setScalar(sc)
      s.material.opacity = 0.45 * (1 - cycle * 0.8)
    })

    // Lantern flicker
    this.lanternLights.forEach((light, i) => {
      light.intensity = 1.2 + Math.sin(t * 3 + i * 5) * 0.5 + Math.sin(t * 7 + i * 3) * 0.3 + Math.sin(t * 11 + i) * 0.2
    })

    // String lights flicker
    this.stringLightMeshes.forEach((bulb, i) => {
      bulb.material.emissiveIntensity = 0.6 + Math.sin(t * 2 + i * 1.7) * 0.15 + Math.sin(t * 4.6 + i * 0.9) * 0.1
    })

    // Cottage breathing
    Object.entries(this.cottages).forEach(([id, c]) => {
      const beer = BEERS.find(b => b.id === id)
      c.group.position.y = Math.sin(t * 0.4 + beer.x) * 0.015
      // Pulse window glow when selected
      if (c.glowMesh) {
        c.glowMesh.material.emissiveIntensity = c.selected ? 1.2 + Math.sin(t * 1.2 + beer.z) * 0.5 : 0.6 + Math.sin(t * 1.2 + beer.z) * 0.3
      }
      c.interiorLight.intensity = c.selected ? 5 : 2
      c.interiorLight.distance = c.selected ? 10 : 5
    })

    // Snowfall
    const posAttr = this.snowPoints.geometry.attributes.position
    for (let i = 0; i < this.snowCount; i++) {
      let x = posAttr.getX(i) + this.snowVelocities[i * 3] + Math.sin(t * 0.5 + i * 0.1) * 0.003
      let y = posAttr.getY(i) + this.snowVelocities[i * 3 + 1]
      let z = posAttr.getZ(i) + this.snowVelocities[i * 3 + 2] + Math.cos(t * 0.3 + i * 0.15) * 0.003
      if (y < 0) {
        x = (Math.random() - 0.5) * this.snowArea
        y = this.snowHeight + Math.random() * 3
        z = (Math.random() - 0.5) * this.snowArea
      }
      posAttr.setXYZ(i, x, y, z)
    }
    posAttr.needsUpdate = true

    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  // ── Helpers ──
  _box(w, h, d, color, pos = [0, 0, 0], extra = {}) {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...extra })
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat)
    mesh.position.set(...pos)
    return mesh
  }
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}
