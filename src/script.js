import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import * as dat from 'lil-gui';
import * as math from 'mathjs'

/**
 * Texture
 */
const textureLoader = new THREE.TextureLoader()
const matcapTexture = textureLoader.load('/textures/matcaps/1.png')

/**
 * Query Parameters
 */

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

let ellipsoidSize = urlParams.get('size')

if (ellipsoidSize == null) {
    ellipsoidSize = 1
}

let covariance = urlParams.getAll('covariance')
console.log(covariance)

function to3x3Array(list) {
    let matrix = [];
    for (let i = 0; i < list.length; i += 3) {
        matrix.push(list.slice(i, i + 3));
    }
    return matrix;
}

const cov_matrix = to3x3Array(covariance)
console.log(cov_matrix)
math.eigs(cov_matrix,)
const eigen = math.eigs(cov_matrix,{eigenvectors: true})
console.log(eigen)

// we need to reverse the order of the vectors and values from high to low
// to get the rotations to work out
let val0 = eigen.values[2]
let vec0 = new THREE.Vector3(
    eigen.eigenvectors[2].vector[0],
    eigen.eigenvectors[2].vector[1],
    eigen.eigenvectors[2].vector[2],
    )

let val1 = eigen.values[1]
let vec1 = new THREE.Vector3(
    eigen.eigenvectors[1].vector[0],
    eigen.eigenvectors[1].vector[1],
    eigen.eigenvectors[1].vector[2],
    )

let val2 = eigen.values[0]
let vec2 = new THREE.Vector3(
    eigen.eigenvectors[0].vector[0],
    eigen.eigenvectors[0].vector[1],
    eigen.eigenvectors[0].vector[2],
    )

let rotationMatrix = new THREE.Matrix4();
rotationMatrix.set(
    vec0.x, vec1.x, vec2.x, 0,
    vec0.y, vec1.y, vec2.y, 0,
    vec0.z, vec1.z, vec2.z, 0,
    0,      0,      0,      1
);

let euler = new THREE.Euler();
euler.setFromRotationMatrix(rotationMatrix, 'XYZ');
console.log(rotationMatrix)
console.log(euler)

/**
 * Debug
 */

const gui = new dat.GUI()


const parameters = {
    color: 0x8ff0a4,
    spin: () => 
    {
        gsap.to(mesh.rotation, {duration: 10, y: (mesh.rotation.y + (Math.PI * 2 * 2))})
    }
}



gui.add(parameters, 'spin')



/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Ellipsoid
 */
const geometry = new THREE.IcosahedronGeometry(1,7,)
const material = new THREE.MeshMatcapMaterial({ matcap: matcapTexture })

// const material = new THREE.MeshBasicMaterial({ color: parameters.color })
const mesh = new THREE.Mesh(geometry, material)


mesh.applyMatrix4(rotationMatrix)
mesh.scale.x = math.sqrt(val0)
mesh.scale.y = math.sqrt(val1)
mesh.scale.z = math.sqrt(val2)

mesh.material.wireframe = true

scene.add(mesh)

/**
 * Axes Helper
 */

const axesHelper = new THREE.AxesHelper(math.sqrt(eigen.values[2])/2)
scene.add(axesHelper)

// Debug
const ellipsoidFolder = gui.addFolder("ellipsoid")
ellipsoidFolder.add(mesh,'visible').name('ellipsoid visible')
ellipsoidFolder
    .addColor(parameters, 'color')
    .onChange(() =>
    {
        material.color.set(parameters.color)
    })

ellipsoidFolder.add(mesh.scale, 'x', 0, 10, 0.01).name('x scale')
ellipsoidFolder.add(mesh.scale, 'y', 0, 10, 0.01).name('y scale')
ellipsoidFolder.add(mesh.scale, 'z', 0, 10, 0.01).name('z scale')
ellipsoidFolder.add(material,'wireframe')

const axesHelperFolder = gui.addFolder("axes helper")
axesHelperFolder.add(axesHelper,'visible')
// axesHelperFolder.add(axesHelper,'size',0,10,0.1)

// gui.addColor(material,"color").name("cube color")



/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.01, 10000)
camera.position.x = math.sqrt(eigen.values[2])
camera.position.y = math.sqrt(eigen.values[2])/2
camera.position.z = math.sqrt(eigen.values[2])
camera.up.set(0,0,1)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()