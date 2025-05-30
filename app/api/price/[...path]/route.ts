import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params
    const path = resolvedParams.path.join('/')
    
    // Build the target URL for CoinGecko free API
    const baseUrl = 'https://api.coingecko.com/api/v3'
    const targetUrl = `${baseUrl}/${path}`
    
    // Forward query parameters from the request
    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString()
    const finalUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl

    console.log('Proxying price request to:', finalUrl)

    // Make the request to CoinGecko API
    const response = await fetch(finalUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // Add User-Agent to avoid potential blocking
        'User-Agent': 'P2Pool-Dashboard/1.0',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Return the data with proper CORS headers and caching
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        // Cache price data for 1 minute to reduce API calls
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
      },
    })
  } catch (error) {
    console.error('Price API proxy error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch price data',
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

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
} 