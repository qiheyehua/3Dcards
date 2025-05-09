// lib/sanityQueries.js
import { client } from './sanityClient'
import { categories as localCategories } from '../data/categories'

// 获取所有类别及其图片
export async function fetchCategories() {
  // GROQ查询，准确匹配你现有的数据结构
  const query = `
    *[_type == "category"] | order(order asc) {
      "name": name,
      "images": *[_type == "galleryImage" && references(^._id)] | order(order asc) {
        "url": coalesce(url, image.asset->url),
        "title": title,
        "description": description
      }
    }
  `
  
  try {
    // 执行查询
    const result = await client.fetch(query)
    
    // 过滤掉没有图片的类别
    const filteredResult = result.filter(category => category.images && category.images.length > 0)
    
    // 如果没有有效数据，使用本地数据
    if (filteredResult.length === 0) {
      console.warn('Sanity没有返回有效数据，使用本地数据作为备份')
      return localCategories
    }
    
    return filteredResult
  } catch (error) {
    console.error('获取Sanity数据失败:', error)
    throw error
  }
}