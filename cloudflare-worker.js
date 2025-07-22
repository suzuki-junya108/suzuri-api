// Cloudflare Worker script for CORS proxy
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Change the hostname to your Vercel deployment
  url.hostname = 'suzuri-api.vercel.app' // Vercelの実際のURLに変更
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      }
    })
  }
  
  // Forward the request to the origin
  const response = await fetch(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.body
  })
  
  // Create a new response with CORS headers
  const newResponse = new Response(response.body, response)
  newResponse.headers.set('Access-Control-Allow-Origin', '*')
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  
  return newResponse
}