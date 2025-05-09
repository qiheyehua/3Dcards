// hooks/useSanityCategories.js
import { useState, useEffect } from 'react'
import { fetchCategories } from '../lib/sanityQueries'
import { categories as localCategories } from '../data/categories'

export function useSanityCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // 获取数据的函数
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await fetchCategories()
      setCategories(data)
    } catch (err) {
      console.error('加载Sanity数据失败:', err)
      setError(err.message || '未知错误')
      // 在出错时使用本地数据作为后备
      setCategories(localCategories)
    } finally {
      setLoading(false)
    }
  }
  
  // 初始化时加载数据
  useEffect(() => {
    fetchData()
  }, [])
  
  // 返回数据、加载状态、错误信息和重新获取数据的函数
  return {
    categories,
    loading,
    error,
    refetch: fetchData
  }
}