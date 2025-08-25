import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const performanceMetric = await request.json()
    
    // En producción, enviarías estas métricas a un servicio de monitoring
    // como DataDog, New Relic, o tu propio sistema de métricas
    
    console.log('[Performance Metric]', {
      timestamp: new Date().toISOString(),
      ...performanceMetric
    })

    // También podrías almacenar en una base de datos para análisis posterior
    // await savePerformanceMetricToDatabase(performanceMetric)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Performance metric recorded' 
    })
  } catch (error) {
    console.error('Failed to process performance metric:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to record performance metric' 
      }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const timeRange = searchParams.get('timeRange') || '24h'
  
  // En un entorno real, obtendrías las métricas de tu base de datos
  // const metrics = await getPerformanceMetricsFromDatabase({ type, timeRange })
  
  const mockMetrics = [
    {
      id: 'perf_1',
      timestamp: new Date().toISOString(),
      type: 'navigation',
      name: 'page_load_time',
      value: 1500,
      url: '/admin/dashboard'
    },
    {
      id: 'perf_2',
      timestamp: new Date().toISOString(),
      type: 'paint',
      name: 'first_contentful_paint',
      value: 800,
      url: '/admin/dashboard'
    }
  ]
  
  return NextResponse.json({
    success: true,
    metrics: mockMetrics,
    summary: {
      avgPageLoad: 1500,
      avgFCP: 800,
      totalRequests: mockMetrics.length
    }
  })
}