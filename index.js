addEventListener('fetch', function(event) {
  if (event.request.method === 'POST') {
    event.respondWith(setCookie(event.request))
  } else {
    event.respondWith(handleRequest(event.request))
  }
})

/**
 * Receives a HTTP request and replies with a response.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
  const { method, url } = request
  const { host, pathname } = new URL(url)

  const fallbackDetails = JSON.parse(await LANDLORD_KV.get('fallback'))

  const cookie = request.headers.get("cookie")
  let tenant = 'fallback'
  let tenantDetails = fallbackDetails

  if (cookie) {
    tenant = cookie.match(/tenant=(.+);*/)
    const storedDetails = await LANDLORD_KV.get(tenant[1])
    if (storedDetails) {
      tenantDetails = JSON.parse(storedDetails)
    }
  }

  if (pathname === '/css') {
    const response = await fetch('https://f0c846ea1f93.eu.ngrok.io/variables.css')
    const css = await response.text()
    
    return new Response(
      css.replace(/--brand-color-primary:(\W*\w+)/, (rule, val) => {
        return rule.replace(val, tenantDetails.primary) 
      }), {
        headers: {
          'Content-Type': 'text/css; charset=utf-8'
        }
      }
    )
  }

  return Response.redirect(tenantDetails[pathname.replace('/', '')], 301)
}

/**
 * Receives a HTTP request and replies with a response.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function setCookie(request) {
  const { tenant } = await request.json()
  const response = new Response(tenant)
  response.headers.append("Set-Cookie", `tenant=${tenant}; Path=/; SameSite=None; Secure; HttpOnly;`)
  
  return response
}