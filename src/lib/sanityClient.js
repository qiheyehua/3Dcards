// lib/sanityClient.js
import { createClient } from '@sanity/client'

// 创建Sanity客户端
export const client = createClient({
  projectId: 'w04355b9', // 替换为你的实际Sanity项目ID
  dataset: 'production',
  apiVersion: '2023-05-03',
  useCdn: false
})

// 图片URL解析函数 - 不需要额外的依赖
export function urlFor(source) {
  // 如果source本身就是URL字符串，直接返回
  if (typeof source === 'string' && (source.startsWith('http') || source.startsWith('/'))) {
    return source;
  }
  // 否则返回原始source
  return source;
}