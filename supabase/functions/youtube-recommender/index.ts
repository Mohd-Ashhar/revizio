import { corsHeaders } from '../_shared/cors.ts'

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY')
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { topics } = await req.json()
    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      throw new Error('"topics" array is required.')
    }

    const recommendations = await Promise.all(
      topics.map(async (topic) => {
        // Formulate a search query
        const searchQuery = `${topic} tutorial explanation`
        const url = `${YOUTUBE_API_URL}?part=snippet&q=${encodeURIComponent(searchQuery)}&key=${YOUTUBE_API_KEY}&maxResults=1&type=video`
        
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`YouTube API request failed with status ${response.status}`)
        }
        
        const data = await response.json()
        const video = data.items[0]
        
        if (video) {
          return {
            topic: topic,
            videoId: video.id.videoId,
            title: video.snippet.title,
            thumbnail: video.snippet.thumbnails.medium.url,
          }
        }
        return null
      })
    )

    // Filter out any null results
    const validRecommendations = recommendations.filter(Boolean)

    return new Response(JSON.stringify({ recommendations: validRecommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})