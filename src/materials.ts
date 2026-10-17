import * as THREE from 'three'

const noise = `
float hash31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float ritualNoise(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x),mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),
    mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z);
}
`

export function createSkin() {
  const material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color().setHSL(.061, .86, .36),
    roughness: .43, metalness: .015, clearcoat: .21, clearcoatRoughness: .48,
    side: THREE.DoubleSide,
  })
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = 'varying vec3 vRitualPosition;\n' + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvRitualPosition = position;')
    shader.fragmentShader = 'varying vec3 vRitualPosition;\n' + noise + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      float organic = ritualNoise(vRitualPosition * 9.0);
      float pores = ritualNoise(vRitualPosition * 145.0);
      float streak = sin(vRitualPosition.y * 4.0 + ritualNoise(vRitualPosition * vec3(48.0, 2.0, 48.0)) * 6.0);
      diffuseColor.rgb *= 0.83 + organic * 0.23 + pores * 0.10 + streak * 0.035;
    `)
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor += (pores - .5) * .13;')
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal = normalize(normal + vec3(dFdx(pores), dFdy(pores), 0.0) * .13);')
  }
  material.customProgramCacheKey = () => 'ritual-skin-v1'
  return material
}

export function createWood() {
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(.061, .30, .077), roughness: .64, metalness: .07,
  })
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = 'varying vec3 vWood;\n' + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvWood = position;')
    shader.fragmentShader = 'varying vec3 vWood;\n' + noise + shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      float whorl = ritualNoise(vWood * vec3(.6, 1.0, 8.0));
      float grain = sin(vWood.z * 190.0 + whorl * 9.0 + sin(vWood.x * 1.2) * 2.0);
      float fineGrain = ritualNoise(vWood * vec3(5.0, 1.0, 260.0));
      diffuseColor.rgb *= .65 + .28 * whorl + .13 * grain + .13 * fineGrain;
    `)
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor += grain * .08 + fineGrain * .06;')
    shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal = normalize(normal + vec3(dFdx(grain), dFdy(grain), 0.0) * .035);')
  }
  material.customProgramCacheKey = () => 'ritual-wood-v1'
  return material
}

export const moonShader = {
  vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `varying vec2 vUv; ${noise}
    void main(){
      float d=length(vUv-.5)*2.0;
      float rock=ritualNoise(vec3(vUv*22.0,2.0))*.13+ritualNoise(vec3(vUv*8.0,1.0))*.2;
      float edge=smoothstep(1.0,.94,d);
      vec3 color=vec3(1.0,.92,.75)*(1.1-rock);
      gl_FragColor=vec4(color,edge);
    }`,
}

export const hazeShader = {
  vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader: `uniform float time; varying vec2 vUv; ${noise}
    void main(){
      float cloud=ritualNoise(vec3(vUv.x*5.0+time*.018,vUv.y*3.0,time*.012));
      float alpha=cloud*smoothstep(0.,.35,vUv.y)*smoothstep(1.,.4,vUv.y)*smoothstep(0.,.2,vUv.x)*smoothstep(1.,.8,vUv.x);
      gl_FragColor=vec4(.25,.22,.30,alpha*.12);
    }`,
}
