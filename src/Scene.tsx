import { Suspense, useEffect, useMemo, useRef, useState, Component } from 'react'
import type { ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AdaptiveDpr, PerformanceMonitor, Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { createLeaf, createPetal, createStem, PETAL_COUNT, pumpkinSurface } from './geometry'
import { createSkin, createWood, hazeShader, moonShader } from './materials'
import { motion, pumpkinClick, revealSecret, scrollSeparation, useRitual } from './ritual'

const warm = new THREE.Color().setHSL(.095, 1, .66)
const cursed = new THREE.Color().setHSL(.76, .9, .64)
const white = new THREE.Color().setHSL(.10, .95, .68)
const spiritLights = {
  Classic: warm,
  Wicked: new THREE.Color().setHSL(.035, 1, .57),
  Haunted: new THREE.Color().setHSL(.56, .20, .79),
  Hollow: new THREE.Color().setHSL(.025, .76, .40),
  Cursed: cursed,
}
const tempColor = new THREE.Color()
const dummy = new THREE.Object3D()
const TAU = Math.PI * 2
const clamp = THREE.MathUtils.clamp
export const sceneMetrics = { drawCalls: 0, triangles: 0, dpr: 1, separation: 0, petals: 10, ready: false, rotation: 0 }

function Pumpkin() {
  const root = useRef<THREE.Group>(null!)
  const petals = useRef<THREE.Group[]>([])
  const stem = useRef<THREE.Group>(null!)
  const core = useRef<THREE.Mesh>(null!)
  const light = useRef<THREE.PointLight>(null!)
  const form = useRitual(s => s.form)
  const completed = useRitual(s => s.completed)
  const [secret, setSecret] = useState(false)
  const { size } = useThree()
  const isMobile = size.width < 760
  const skin = useMemo(createSkin, [])
  const flesh = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(.072, .88, .40), roughness: .7,
    emissive: warm, emissiveIntensity: .10, side: THREE.DoubleSide,
  }), [])
  const coreMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: white.clone().multiplyScalar(3.4), toneMapped: false }), [])
  const geometries = useMemo(() => Array.from({ length: PETAL_COUNT }, (_, i) => {
    const geometry = createPetal(i, form, secret && form === 'Classic')
    const theta = -Math.PI + (i + .5) * TAU / PETAL_COUNT
    const pivot = pumpkinSurface(theta, 0).multiplyScalar(.72)
    geometry.translate(-pivot.x, -pivot.y, -pivot.z)
    return { geometry, theta, pivot }
  }), [form, secret])
  const stemGeometry = useMemo(createStem, [])
  const drag = useRef({ down: false, x: 0, y: 0, startX: 0, startY: 0, moved: false })
  const separation = useRef(0)
  const rotation = useRef(0)

  useEffect(() => () => geometries.forEach(p => p.geometry.dispose()), [geometries])
  useEffect(() => () => { skin.dispose(); flesh.dispose(); coreMaterial.dispose(); stemGeometry.dispose() }, [skin, flesh, coreMaterial, stemGeometry])
  useEffect(() => {
    if (!completed) { setSecret(false); return }
    return revealSecret(() => setSecret(true))
  }, [completed])

  useFrame((state, delta) => {
    if (!root.current) return
    const t = state.clock.elapsedTime
    const busy = useRitual.getState().busy
    const target = busy ? motion.separation : scrollSeparation(motion.progress)
    separation.current = THREE.MathUtils.damp(separation.current, Math.max(0, target), 6, delta)
    const sep = separation.current
    sceneMetrics.separation = sep
    const breathing = motion.reduced ? 0 : Math.sin(t * 1.3) * .009
    root.current.scale.setScalar((isMobile ? .80 - sep * .18 : 1) * (1 + breathing))
    root.current.position.set(isMobile ? 0 : 1.48, -.02 + sep * (isMobile ? -.10 : .20), 0)
    const scrollRotation = motion.progress < .35 ? motion.progress * TAU * .85 : Math.PI * .20
    const auto = motion.reduced || drag.current.down ? 0 : Math.sin(t * .22) * .055
    const targetRotation = motion.drag + motion.rotation + scrollRotation + motion.pointerX * .075 + auto
    rotation.current = THREE.MathUtils.damp(rotation.current, targetRotation, 5, delta)
    root.current.rotation.set(motion.pointerY * .025, rotation.current, 0)
    sceneMetrics.rotation = rotation.current
    for (let i = 0; i < PETAL_COUNT; i++) {
      const part = petals.current[i]
      if (!part) continue
      const { theta, pivot } = geometries[i]
      const drift = motion.reduced ? 0 : Math.sin(t * .65 + i * 1.7) * .055 * sep
      const open = sep + motion.morph * .25
      part.position.set(pivot.x + Math.sin(theta) * open * (isMobile ? .67 : .88),
        pivot.y + open * (.28 + Math.sin(i * 1.9) * .22) + drift,
        pivot.z + Math.cos(theta) * open * .88)
      part.rotation.set(Math.cos(theta) * open * .18, Math.sin(t * .25 + i) * .045 * sep,
        -Math.sin(theta) * open * .16)
      part.scale.setScalar(1 - motion.morph * .93)
    }
    stem.current.position.set(0, sep * 1.13 + motion.morph * .55, 0)
    stem.current.rotation.z = sep * .22 + (motion.reduced ? 0 : Math.sin(t * .7) * .04 * sep)
    stem.current.scale.setScalar(1 - motion.morph * .85)
    const curseAmount = form === 'Cursed' ? 1 : motion.midnight
    tempColor.copy(spiritLights[form]).lerp(cursed, curseAmount)
    light.current.color.copy(tempColor)
    flesh.emissive.copy(tempColor)
    flesh.emissiveIntensity = .10 + sep * .30 + motion.flash
    coreMaterial.color.copy(form === 'Classic' ? white : spiritLights[form]).lerp(cursed, curseAmount)
      .multiplyScalar((form === 'Hollow' ? .85 : 1.9) + motion.flash * 2)
    core.current.scale.setScalar(THREE.MathUtils.lerp(.79, .105, sep))
    core.current.position.y = -.08 + sep * .20
    light.current.intensity = (form === 'Hollow' ? 2.5 : 5.5) + sep * 5 + motion.hover * 4 + motion.flash * 7
      + (motion.reduced ? 0 : Math.sin(t * 6.1) * .16 + Math.sin(t * 9.4) * .12)
    if (state.clock.elapsedTime > .3 && !useRitual.getState().ready) {
      sceneMetrics.ready = true
      useRitual.setState({ ready: true })
    }
  })

  return <group ref={root}
    onPointerOver={e => { e.stopPropagation(); motion.hover = 1; document.body.classList.add('over-pumpkin') }}
    onPointerOut={() => { motion.hover = 0; document.body.classList.remove('over-pumpkin') }}
    onPointerDown={e => {
      e.stopPropagation()
      drag.current = { down: true, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, moved: false }
      const target = e.target as unknown as { setPointerCapture: (id: number) => void }
      target.setPointerCapture(e.pointerId)
    }}
    onPointerMove={e => {
      if (!drag.current.down) return
      e.stopPropagation()
      if (Math.hypot(e.clientX - drag.current.startX, e.clientY - drag.current.startY) > 6) drag.current.moved = true
      motion.drag += (e.clientX - drag.current.x) * .009
      drag.current.x = e.clientX
    }}
    onPointerUp={e => {
      e.stopPropagation()
      const wasDown = drag.current.down
      drag.current.down = false
      const target = e.target as unknown as { releasePointerCapture: (id: number) => void }
      target.releasePointerCapture(e.pointerId)
      if (wasDown && !drag.current.moved) {
        if (completed && !useRitual.getState().busy && motion.progress > .96) setSecret(true)
        pumpkinClick()
      }
    }}
    onPointerCancel={() => { drag.current.down = false }}>
    {geometries.map(({ geometry, pivot }, i) => <group key={i} ref={el => { if (el) petals.current[i] = el }} position={pivot}>
      <mesh geometry={geometry} material={[skin, flesh]} castShadow receiveShadow />
    </group>)}
    <group ref={stem}>
      <mesh geometry={stemGeometry} castShadow>
        <meshStandardMaterial color="hsl(49, 25%, 20%)" roughness={.94} />
      </mesh>
      <mesh position={[0, 1.12, 0]} scale={[1, .45, 1]} castShadow>
        <sphereGeometry args={[.19, 16, 8]} />
        <meshStandardMaterial color="hsl(42, 28%, 19%)" roughness={.96} />
      </mesh>
    </group>
    <mesh ref={core} scale={.79}>
      <sphereGeometry args={[1, 24, 20]} />
      <primitive object={coreMaterial} attach="material" />
    </mesh>
    <pointLight ref={light} position={[0, -.05, .22]} color={warm} intensity={7} distance={7} decay={2} />
  </group>
}

function Terrace() {
  const boards = useRef<THREE.InstancedMesh>(null!)
  const material = useMemo(createWood, [])
  const geometry = useMemo(() => new THREE.BoxGeometry(5.5, .14, .57), [])
  useEffect(() => {
    let i = 0
    for (let row = 0; row < 38; row++) for (let col = 0; col < 4; col++) {
      dummy.position.set((col - 1.5) * 5.52 + (row % 2) * 1.7, -1.25, 7 - row * .59)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.set(1, 1, 1)
      dummy.updateMatrix()
      boards.current.setMatrixAt(i, dummy.matrix)
      boards.current.setColorAt(i, new THREE.Color().setHSL(.06, .15 + (row % 3) * .03, .68 + (row % 4) * .055))
      i++
    }
    boards.current.instanceMatrix.needsUpdate = true
    if (boards.current.instanceColor) boards.current.instanceColor.needsUpdate = true
    return () => { geometry.dispose(); material.dispose() }
  }, [geometry, material])
  return <>
    <instancedMesh ref={boards} args={[geometry, material, 152]} receiveShadow />
    <group position={[0, -1.17, -7.8]}>
      {[-.03, 1.05].map(y => <mesh key={y} position={[0, y, 0]} castShadow>
        <boxGeometry args={[22, .09, .13]} />
        <meshStandardMaterial color="hsl(250, 10%, 5%)" roughness={.82} />
      </mesh>)}
      {Array.from({ length: 34 }, (_, i) => <mesh key={i} position={[-10.5 + i * .65, .47, 0]}>
        <boxGeometry args={[i % 8 === 0 ? .13 : .045, 1.12, .07]} />
        <meshStandardMaterial color="hsl(250, 12%, 5%)" roughness={.85} />
      </mesh>)}
    </group>
  </>
}

const seeded = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

function Leaves() {
  const mesh = useRef<THREE.InstancedMesh>(null!)
  const geometry = useMemo(createLeaf, [])
  const leaves = useMemo(() => Array.from({ length: 24 }, (_, i) => ({
    x: (seeded(i + 1) - .5) * 15, z: (seeded(i + 31) - .5) * 11,
    angle: seeded(i + 19) * TAU, scale: .12 + seeded(i + 9) * .16,
  })), [])
  useEffect(() => {
    leaves.forEach((_, i) => mesh.current.setColorAt(i, new THREE.Color().setHSL(.025 + seeded(i) * .065, .55, .13 + seeded(i + 10) * .12)))
    return () => geometry.dispose()
  }, [geometry, leaves])
  useFrame(({ clock }) => {
    const sep = sceneMetrics.separation
    const t = motion.reduced ? 0 : clock.elapsedTime
    leaves.forEach((leaf, i) => {
      const proximity = clamp(1 - Math.hypot(leaf.x - 1.5, leaf.z) / 6, 0, 1)
      const breeze = sep * proximity
      dummy.position.set(leaf.x + Math.sin(t * .8 + i) * breeze * .5,
        -1.156 + breeze * (.3 + Math.sin(t * .9 + i) * .28), leaf.z + breeze * Math.cos(i) * .6)
      dummy.rotation.set(-Math.PI / 2 + breeze * Math.sin(t + i) * .7, breeze * .5, leaf.angle + breeze * t * .1)
      dummy.scale.setScalar(leaf.scale)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(i, dummy.matrix)
    })
    mesh.current.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={mesh} args={[geometry, undefined, 24]} castShadow>
    <meshStandardMaterial roughness={.9} side={THREE.DoubleSide} />
  </instancedMesh>
}

function MoonAndMist() {
  const { size } = useThree()
  const mobile = size.width < 760
  const haze = useRef<THREE.ShaderMaterial>(null!)
  const cloud = useRef<THREE.Mesh>(null!)
  const ghost = useRef<THREE.ShaderMaterial>(null!)
  const ghostAppearance = useRef({ active: false, since: 0 })
  const uniforms = useMemo(() => ({ time: { value: 0 } }), [])
  const ghostUniforms = useMemo(() => ({ opacity: { value: 0 } }), [])
  useFrame(({ clock }) => {
    const t = motion.reduced ? 0 : clock.elapsedTime
    haze.current.uniforms.time.value = t
    cloud.current.position.x = Math.sin(t * .065) * 3.5
    const p = motion.progress
    const inRange = p > .58 && p < .73 && !motion.reduced
    if (inRange && !ghostAppearance.current.active) ghostAppearance.current.since = t
    ghostAppearance.current.active = inRange
    const fade = Math.exp(-Math.max(0, t - ghostAppearance.current.since - .5) * 1.6)
    ghost.current.uniforms.opacity.value = inRange ? Math.sin((p - .58) / .15 * Math.PI) * .07 * fade : 0
  })
  return <>
    <group position={[mobile ? 2.8 : 7, mobile ? 4.8 : 3.4, -14]}>
    <mesh>
      <planeGeometry args={[.74, .74]} />
      <shaderMaterial {...moonShader} transparent toneMapped={false} />
    </mesh>
    <mesh position={[0, 0, -.02]}>
      <planeGeometry args={[4, 4]} />
      <shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending}
        vertexShader={moonShader.vertexShader}
        fragmentShader="varying vec2 vUv;void main(){float d=length(vUv-.5);gl_FragColor=vec4(.8,.65,.4,exp(-d*13.)*.055);}" />
    </mesh>
    <mesh ref={cloud} position={[0, 0, .1]}>
      <planeGeometry args={[6, 1]} />
      <shaderMaterial transparent depthWrite={false} vertexShader={moonShader.vertexShader}
        fragmentShader="varying vec2 vUv;void main(){float a=exp(-pow((vUv.y-.5)*7.,2.))*sin(vUv.x*3.14159);gl_FragColor=vec4(.025,.02,.04,a*.58);}" />
    </mesh>
    </group>
    <mesh position={[0, -.2, -5]}>
      <planeGeometry args={[24, 4]} />
      <shaderMaterial ref={haze} uniforms={uniforms} {...hazeShader} transparent depthWrite={false} />
    </mesh>
    <mesh position={[-3.5, .2, -6]}>
      <planeGeometry args={[1.3, 2.0]} />
      <shaderMaterial ref={ghost} uniforms={ghostUniforms} transparent depthWrite={false}
        vertexShader={moonShader.vertexShader}
        fragmentShader={`varying vec2 vUv;uniform float opacity;
          void main(){vec2 p=vUv-vec2(.5,.55);float head=1.-smoothstep(.12,.2,length(p-vec2(0.,.2)));float body=(1.-smoothstep(.22,.35,abs(p.x)))*smoothstep(-.5,-.1,p.y)*(1.-smoothstep(.15,.25,p.y));gl_FragColor=vec4(.75,.72,.85,max(head,body)*opacity);}`} />
    </mesh>
  </>
}

function Embers() {
  const ref = useRef<THREE.InstancedMesh>(null!)
  useFrame(({ clock, size }) => {
    const t = motion.reduced ? 0 : clock.elapsedTime
    const sep = sceneMetrics.separation
    for (let i = 0; i < 40; i++) {
      const phase = (t * (.06 + seeded(i + 8) * .03) + seeded(i)) % 1
      const a = seeded(i + 14) * TAU
      const r = .3 + seeded(i + 18) * 1.9
      dummy.position.set((size.width < 760 ? 0 : 1.48) + Math.sin(a + phase) * r, -.7 + phase * 3.2, Math.cos(a) * r)
      dummy.scale.setScalar(motion.reduced ? 0 : (sep * .008 + motion.flash * .019) * Math.sin(phase * Math.PI))
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={ref} args={[undefined, undefined, 40]} frustumCulled={false}>
    <sphereGeometry args={[1, 4, 4]} />
    <meshBasicMaterial color={[3.5, 1.6, .45]} toneMapped={false} />
  </instancedMesh>
}

function CameraRig() {
  const { camera, size, gl } = useThree()
  const sample = useRef({ elapsed: 0, frames: 0 })
  useEffect(() => {
    camera.position.set(0, size.width < 760 ? 2.5 : 2.05, size.width < 760 ? 9.5 : 9)
    camera.lookAt(0, size.width < 760 ? .64 : .45, 0)
    camera.updateProjectionMatrix()
  }, [camera, size])
  useEffect(() => {
    const lost = (e: Event) => {
      e.preventDefault()
      window.dispatchEvent(new CustomEvent('ritual-context', { detail: false }))
    }
    const restored = () => window.dispatchEvent(new CustomEvent('ritual-context', { detail: true }))
    gl.domElement.addEventListener('webglcontextlost', lost)
    gl.domElement.addEventListener('webglcontextrestored', restored)
    return () => {
      gl.domElement.removeEventListener('webglcontextlost', lost)
      gl.domElement.removeEventListener('webglcontextrestored', restored)
    }
  }, [gl])
  useFrame((_, delta) => {
    sceneMetrics.drawCalls = gl.info.render.calls
    sceneMetrics.triangles = gl.info.render.triangles
    sceneMetrics.dpr = gl.getPixelRatio()
    sample.current.elapsed += delta
    sample.current.frames++
    if (sample.current.elapsed > .5) {
      const element = gl.domElement
      element.dataset.fps = (sample.current.frames / sample.current.elapsed).toFixed(0)
      element.dataset.separation = sceneMetrics.separation.toFixed(3)
      element.dataset.rotation = sceneMetrics.rotation.toFixed(3)
      element.dataset.dpr = sceneMetrics.dpr.toFixed(2)
      element.dataset.petals = String(PETAL_COUNT)
      sample.current = { elapsed: 0, frames: 0 }
    }
  })
  return null
}

function World({ quality }: { quality: boolean }) {
  return <>
    <color attach="background" args={['hsl(255, 19%, 5%)']} />
    <fog attach="fog" args={['hsl(255, 16%, 5%)', 9, 28]} />
    <ambientLight intensity={.32} color="hsl(264, 22%, 66%)" />
    <hemisphereLight intensity={.3} color="hsl(245, 26%, 66%)" groundColor="hsl(25, 28%, 15%)" />
    <directionalLight position={[5, 7, -6]} color="hsl(235, 30%, 78%)" intensity={1.4} />
    <spotLight position={[-3, 6, 5]} angle={.65} penumbra={.9} intensity={52} color="hsl(34, 62%, 79%)"
      castShadow shadow-mapSize={[1024, 1024]} shadow-bias={-.0003} shadow-normalBias={.025} />
    <spotLight position={[5, 3, 2]} angle={.8} penumbra={1} intensity={22} color="hsl(24, 72%, 57%)" />
    <CameraRig />
    <Terrace />
    <MoonAndMist />
    <Leaves />
    <Pumpkin />
    <Embers />
    {!motion.reduced && <Sparkles count={25} scale={[18, 5, 9]} position={[0, 1.6, -2]} size={1} speed={.12} opacity={.18} color="hsl(40, 50%, 73%)" />}
    <EffectComposer multisampling={quality ? 2 : 0} resolutionScale={quality ? .85 : .65}>
      <Bloom intensity={.48} luminanceThreshold={1.15} luminanceSmoothing={.55} mipmapBlur />
      <Vignette offset={.25} darkness={.60} eskil={false} />
    </EffectComposer>
  </>
}

export function Fallback() {
  useEffect(() => { useRitual.setState({ ready: true }) }, [])
  return <div className="fallback-scene" role="img" aria-label="A carved pumpkin glowing under the midnight moon">
    <svg viewBox="0 0 600 600" aria-hidden="true">
      <defs>
        <radialGradient id="pumpkin"><stop stopColor="hsl(30,80%,47%)"/><stop offset="1" stopColor="hsl(20,85%,23%)"/></radialGradient>
        <radialGradient id="ground"><stop stopColor="hsl(26,80%,24%)" stopOpacity=".6"/><stop offset="1" stopOpacity="0"/></radialGradient>
      </defs>
      <ellipse cx="310" cy="470" rx="230" ry="50" fill="url(#ground)"/>
      <path d="M302 190q-18-72 28-89l13 19q-42 32-26 73" fill="hsl(45,25%,23%)"/>
      <path d="M305 193C89 104 89 457 218 460q86 33 174-6C521 423 502 116 305 193" fill="url(#pumpkin)"/>
      {[220,270,330,380].map(x=><path key={x} d={`M305 193Q${x-80} 300 ${x} 460`} fill="none" stroke="hsl(21,74%,21%)" strokeWidth="4" opacity=".7"/>)}
      <path d="m185 300 85 4-40-70Zm240 0-85 4 40-70ZM185 343q118 80 240 0l-32 74-57 13-9-24-26 1-3 23-66-17Z" fill="hsl(42,100%,78%)"/>
    </svg>
    <p>WEBGL IS UNAVAILABLE · STILL A LITTLE MAGIC</p>
  </div>
}

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <Fallback /> : this.props.children }
}

export default function Scene() {
  const [quality, setQuality] = useState(true)
  const [dpr, setDpr] = useState(Math.min(window.devicePixelRatio, 1.6))
  const [available, setAvailable] = useState(true)
  useEffect(() => {
    const changed = (event: Event) => setAvailable((event as CustomEvent<boolean>).detail)
    window.addEventListener('ritual-context', changed)
    return () => window.removeEventListener('ritual-context', changed)
  }, [])
  return <SceneBoundary>
    <Canvas shadows camera={{ fov: 36, near: .1, far: 60 }} dpr={dpr}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.13 }}
      fallback={<Fallback />}>
      <Suspense fallback={null}>
        <PerformanceMonitor onDecline={() => { setDpr(1); setQuality(false) }} onIncline={() => { setDpr(Math.min(window.devicePixelRatio, 1.6)); setQuality(true) }} flipflops={2} onFallback={() => { setDpr(1); setQuality(false) }}>
          <AdaptiveDpr pixelated />
          <World quality={quality} />
        </PerformanceMonitor>
      </Suspense>
    </Canvas>
    {!available && <Fallback />}
  </SceneBoundary>
}
