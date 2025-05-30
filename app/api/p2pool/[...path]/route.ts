import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const apiUrl = searchParams.get('apiUrl') || 'https://mini.p2pool.observer'
    const resolvedParams = await params
    const path = resolvedParams.path.join('/')
    
    // Build the target URL
    const targetUrl = `${apiUrl}/api/${path}`
    const queryString = new URLSearchParams()
    
    // Forward query parameters (except apiUrl)
    searchParams.forEach((value, key) => {
      if (key !== 'apiUrl') {
        queryString.append(key, value)
      }
    })
    
    const finalUrl = queryString.toString() 
      ? `${targetUrl}?${queryString}`
      : targetUrl

    if (process.env.NODE_ENV === 'development') {
      console.log('Proxying request to:', finalUrl)
    }

    // Make the request to the P2Pool API
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Return the data with proper CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  } catch (error) {
    // Silent handling for network outages - only log in development mode
    if (process.env.NODE_ENV === 'development') {
      console.warn('P2Pool API proxy error (expected during network outages):', error)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch data from P2Pool API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    )
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 