import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  try {
    // 1. Fetch the main page to get the VQD token
    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
    const mainResponse = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!mainResponse.ok) {
      throw new Error(`Failed to load DuckDuckGo main page: ${mainResponse.statusText}`);
    }

    const html = await mainResponse.text();
    // DuckDuckGo puts the vqd token in the HTML, e.g. vqd="4-1234567890..." or vqd='4-1234567890...'
    const vqdRegex = /vqd=([^&'"]+)/;
    const match = html.match(vqdRegex);
    
    if (!match) {
      // Try an alternative regex match
      const vqdAlternativeRegex = /vqd=['"]?([^'"]+)['"]?/;
      const matchAlt = html.match(vqdAlternativeRegex);
      if (!matchAlt) {
        throw new Error("Could not extract VQD token from DuckDuckGo");
      }
      return await fetchImages(query, matchAlt[1]);
    }

    const vqd = match[1];
    return await fetchImages(query, vqd);
  } catch (error: any) {
    console.error("DuckDuckGo image search error:", error);
    return NextResponse.json({ error: error.message || "Failed to search images" }, { status: 500 });
  }
}

async function fetchImages(query: string, vqd: string) {
  const imageSearchUrl = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&vqd=${vqd}&o=json`;
  
  const response = await fetch(imageSearchUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Referer": "https://duckduckgo.com/",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch images from DuckDuckGo: ${response.statusText}`);
  }

  const data = await response.json();
  const results = data.results || [];
  
  // Return the mapped results containing image URL and title
  const formattedResults = results.map((item: any) => ({
    url: item.image,
    title: item.title,
    thumbnail: item.thumbnail,
    width: item.width,
    height: item.height,
  }));

  return NextResponse.json({ results: formattedResults });
}
