import * as THREE from 'three'
import { useLayoutEffect, useRef, useState } from 'react'
import { Canvas, extend, useFrame } from '@react-three/fiber'
import { Image, ScrollControls, useScroll, Billboard, Text } from '@react-three/drei'
import { suspend } from 'suspend-react'
import { easing, geometry } from 'maath'
import { useSanityCategories } from './hooks/useSanityCategories'

extend(geometry)
const inter = import('@pmndrs/assets/fonts/inter_regular.woff')

export const App = () => {
  // 使用Sanity数据钩子
  const { categories, loading } = useSanityCategories()
  
  // 显示加载状态
  if (loading) {
    return <div className="loading">正在加载数据...</div>
  }
  
  // 正常渲染3D卡片展示
  return (
    <Canvas dpr={[1, 1.5]}>
      <ScrollControls pages={4} infinite>
        <Scene position={[0, 1.5, 0]} categories={categories} />
      </ScrollControls>
    </Canvas>
  )
}

function Scene({ categories, children, ...props }) {
  const ref = useRef()
  const scroll = useScroll()
  const [hovered, hover] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)
  const [activeImageIndex, setActiveImageIndex] = useState(null)
  
  useFrame((state, delta) => {
    ref.current.rotation.y = -scroll.offset * (Math.PI * 2) // Rotate contents
    state.events.update() // Raycasts every frame rather than on pointer-move
    easing.damp3(state.camera.position, [-state.pointer.x * 2, state.pointer.y * 2 + 4.5, 9], 0.3, delta)
    state.camera.lookAt(0, 0, 0)
  })
  
  // 计算每个类别占据的弧度
  const categoryAngle = (Math.PI * 2) / categories.length
  
  return (
    <group ref={ref} {...props}>
      {categories.map((category, index) => {
        const from = index * categoryAngle
        const len = categoryAngle
        const verticalOffset = index % 2 === 0 ? 0 : (index % 4 === 1 ? 0.4 : -0.4) // 交替的垂直位置
        
        return (
          <Cards 
            key={category.name}
            categoryData={category}
            from={from} 
            len={len} 
            position={[0, verticalOffset, 0]}
            onPointerOver={(imgIndex) => {
              hover(imgIndex)
              setActiveCategory(index)
              setActiveImageIndex(imgIndex)
            }} 
            onPointerOut={() => {
              hover(null)
              setActiveCategory(null)
              setActiveImageIndex(null)
            }}
          />
        )
      })}
      <ActiveCard 
        hovered={hovered} 
        categoryData={activeCategory !== null ? categories[activeCategory] : null}
        imageIndex={activeImageIndex}
      />
    </group>
  )
}

function Cards({ categoryData, from = 0, len = Math.PI * 2, radius = 5.25, onPointerOver, onPointerOut, ...props }) {
  const [hovered, hover] = useState(null)
  const { name, images } = categoryData
  const amount = Math.min(Math.round(len * 22), images.length)
  const textPosition = from + (len / 2)
  
  return (
    <group {...props}>
      <Billboard position={[Math.sin(textPosition) * radius * 1.4, 0.5, Math.cos(textPosition) * radius * 1.4]}>
        <Text font={suspend(inter).default} fontSize={0.3} anchorX="center" color="black">
          {name}
        </Text>
      </Billboard>
      {images.slice(0, amount).map((image, i) => {
        const angle = from + (i / (amount + 3)) * len
        return (
          <Card
            key={angle}
            onPointerOver={(e) => (e.stopPropagation(), hover(i), onPointerOver(i))}
            onPointerOut={() => (hover(null), onPointerOut(null))}
            position={[Math.sin(angle) * radius, 0, Math.cos(angle) * radius]}
            rotation={[0, Math.PI / 2 + angle, 0]}
            active={hovered !== null}
            hovered={hovered === i}
            url={image.url}
            imageData={image}
          />
        )
      })}
    </group>
  )
}

function Card({ url, imageData, active, hovered, ...props }) {
  const ref = useRef()
  
  // 16:9比例计算
  const width = 1.618
  const height = width * (9/16)
  
  useFrame((state, delta) => {
    const f = hovered ? 1.4 : active ? 1.25 : 1
    easing.damp3(ref.current.position, [0, hovered ? 0.25 : 0, 0], 0.1, delta)
    easing.damp3(ref.current.scale, [width * f, height * f, 1], 0.15, delta)
  })
  
  return (
    <group {...props}>
      <Image ref={ref} transparent radius={0.075} url={url} scale={[width, height, 1]} side={THREE.DoubleSide} />
    </group>
  )
}

function ActiveCard({ hovered, categoryData, imageIndex, ...props }) {
  const ref = useRef()
  
  useLayoutEffect(() => {
    if (ref.current?.material) {
      ref.current.material.zoom = 0.8
    }
  }, [hovered])
  
  useFrame((state, delta) => {
    if (ref.current?.material) {
      easing.damp(ref.current.material, 'zoom', 1, 0.5, delta)
      easing.damp(ref.current.material, 'opacity', hovered !== null, 0.3, delta)
    }
  })
  
  // 如果没有选中任何图片，不显示详情
  if (!categoryData || imageIndex === null || imageIndex >= categoryData.images.length) {
    return null
  }
  
  const imageData = categoryData.images[imageIndex]
  
  // 16:9比例计算
  const width = 4.0
  const height = width * (9/16)
  const centerY = 1.5
  
  return (
    <Billboard {...props}>
      <Text font={suspend(inter).default} fontSize={0.5} position={[width / 2 + 0.5, centerY + height / 2 + 0.5, 0]} anchorX="left" color="black">
        {imageData.title}
      </Text>
      <Text font={suspend(inter).default} fontSize={0.25} position={[width / 2 + 0.5, centerY + height / 2, 0]} anchorX="left" color="black" maxWidth={3}>
        {imageData.description}
      </Text>
      <Image 
        ref={ref} 
        transparent 
        radius={0.3} 
        position={[0, centerY, 0]} 
        scale={[width, height, 0.2]} 
        url={imageData.url} 
      />
    </Billboard>
  )
}
