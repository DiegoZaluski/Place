# ??? 
DIRECT_SITES = {
    # SOCIAL MEDIA
    "facebook": "https://www.facebook.com/search/top/?q={query}",
    "twitter": "https://twitter.com/search?q={query}",
    "instagram": "https://www.instagram.com/explore/tags/{query}/",
    "linkedin": "https://www.linkedin.com/search/results/all/?keywords={query}",
    "reddit": "https://www.reddit.com/search/?q={query}",
    "pinterest": "https://www.pinterest.com/search/pins/?q={query}",
    "tiktok": "https://www.tiktok.com/search?q={query}",
    "whatsapp": "https://web.whatsapp.com/",
    "telegram": "https://t.me/{query}",
    "discord": "https://discord.com/channels/@me",
    "snapchat": "https://www.snapchat.com/add/{query}",
    
    # VIDEO & STREAMING
    "youtube": "https://www.youtube.com/results?search_query={query}",
    "netflix": "https://www.netflix.com/search?q={query}",
    "twitch": "https://www.twitch.tv/search?term={query}",
    "vimeo": "https://vimeo.com/search?q={query}",
    "dailymotion": "https://www.dailymotion.com/search/{query}",
    "disney_plus": "https://www.disneyplus.com/search/{query}",
    "hbo_max": "https://play.hbomax.com/search?q={query}",
    "amazon_prime": "https://www.primevideo.com/search/ref=atv_sr_sug_?query={query}",
    
    # MUSIC & AUDIO
    "spotify": "https://open.spotify.com/search/{query}",
    "deezer": "https://www.deezer.com/search/{query}",
    "soundcloud": "https://soundcloud.com/search?q={query}",
    "apple_music": "https://music.apple.com/us/search?term={query}",
    "youtube_music": "https://music.youtube.com/search?q={query}",
    "pandora": "https://www.pandora.com/search/{query}",
    "tidal": "https://tidal.com/search/{query}",
    
    # E-COMMERCE & SHOPPING
    "amazon": "https://www.amazon.com/s?k={query}",
    "ebay": "https://www.ebay.com/sch/i.html?_nkw={query}",
    "aliexpress": "https://pt.aliexpress.com/wholesale?SearchText={query}",
    "shopee": "https://shopee.com.br/search?keyword={query}",
    "mercadolivre": "https://lista.mercadolivre.com.br/{query}",
    "magazineluiza": "https://www.magazineluiza.com.br/busca/{query}",
    "americanas": "https://www.americanas.com.br/busca/{query}",
    "submarino": "https://www.submarino.com.br/busca/{query}",
    "best_buy": "https://www.bestbuy.com/site/searchpage.jsp?st={query}",
    "walmart": "https://www.walmart.com/search/?query={query}",
    "target": "https://www.target.com/s?searchTerm={query}",
    "etsy": "https://www.etsy.com/search?q={query}",
    "zalando": "https://www.zalando.com/search/?q={query}",
    "asos": "https://www.asos.com/search/?q={query}",
    
    # SEARCH ENGINES & KNOWLEDGE
    "google": "https://www.google.com/search?q={query}",
    "bing": "https://www.bing.com/search?q={query}",
    "yahoo": "https://search.yahoo.com/search?p={query}",
    "duckduckgo": "https://duckduckgo.com/?q={query}",
    "wikipedia": "https://en.wikipedia.org/wiki/{query}",
    "wikihow": "https://www.wikihow.com/wikiHowTo?search={query}",
    "quora": "https://www.quora.com/search?q={query}",
    "stack_overflow": "https://stackoverflow.com/search?q={query}",
    "stackexchange": "https://stackexchange.com/search?q={query}",
    "github": "https://github.com/search?q={query}",
    "gitlab": "https://gitlab.com/search?search={query}",
    "medium": "https://medium.com/search?q={query}",
    
    # NEWS & MEDIA
    "cnn": "https://edition.cnn.com/search?q={query}",
    "bbc": "https://www.bbc.co.uk/search?q={query}",
    "reuters": "https://www.reuters.com/search/news?blob={query}",
    "the_guardian": "https://www.theguardian.com/international",
    "new_york_times": "https://www.nytimes.com/search?query={query}",
    "washington_post": "https://www.washingtonpost.com/newssearch/?query={query}",
    "fox_news": "https://www.foxnews.com/search-results/search?q={query}",
    
    # TECHNOLOGY & DEVELOPMENT
    "npm": "https://www.npmjs.com/search?q={query}",
    "pypi": "https://pypi.org/search/?q={query}",
    "docker_hub": "https://hub.docker.com/search?q={query}",
    "kubernetes": "https://kubernetes.io/search/?q={query}",
    "microsoft_docs": "https://docs.microsoft.com/en-us/search/?terms={query}",
    "developer_mozilla": "https://developer.mozilla.org/en-US/search?q={query}",
    "digitalocean": "https://www.digitalocean.com/community/search?q={query}",
    "heroku": "https://www.heroku.com/search?q={query}",
    
    # PRODUCTIVITY & BUSINESS
    "google_docs": "https://docs.google.com/document/u/0/?q={query}",
    "google_sheets": "https://docs.google.com/spreadsheets/u/0/?q={query}",
    "google_slides": "https://docs.google.com/presentation/u/0/?q={query}",
    "trello": "https://trello.com/search?q={query}",
    "slack": "https://slack.com/search?q={query}",
    "asana": "https://app.asana.com/search?q={query}",
    "notion": "https://www.notion.so/search?q={query}",
    "jira": "https://jira.com/search?q={query}",
    "confluence": "https://confluence.com/search?q={query}",
    
    # EDUCATION & LEARNING
    "coursera": "https://www.coursera.org/search?query={query}",
    "udemy": "https://www.udemy.com/courses/search/?q={query}",
    "edx": "https://www.edx.org/search?q={query}",
    "khan_academy": "https://www.khanacademy.org/search?page_search_query={query}",
    "ted": "https://www.ted.com/search?q={query}",
    "academia_edu": "https://www.academia.edu/search?q={query}",
    "researchgate": "https://www.researchgate.net/search/search?q={query}",
    
    # TRAVEL & TRANSPORTATION
    "booking": "https://www.booking.com/searchresults.html?ss={query}",
    "airbnb": "https://www.airbnb.com/s/{query}/homes",
    "tripadvisor": "https://www.tripadvisor.com/Search?q={query}",
    "expedia": "https://www.expedia.com/search?q={query}",
    "skyscanner": "https://www.skyscanner.com/transport/flights/{query}",
    "uber": "https://www.uber.com/global/en/search/?q={query}",
    "lyft": "https://www.lyft.com/rider/search?q={query}",
    "google_maps": "https://www.google.com/maps/search/{query}",
    "waze": "https://www.waze.com/live-map/directions?q={query}",
    
    # FOOD & DELIVERY
    "ubereats": "https://www.ubereats.com/search?q={query}",
    "ifood": "https://www.ifood.com.br/busca?q={query}",
    "rappid": "https://www.rappid.com/search?q={query}",
    "grubhub": "https://www.grubhub.com/search?query={query}",
    "doordash": "https://www.doordash.com/search/?query={query}",
    "yelp": "https://www.yelp.com/search?find_desc={query}",
    "tripadvisor_restaurants": "https://www.tripadvisor.com/Search?q={query}&ssrc=e",
    
    # FINANCE & BANKING
    "paypal": "https://www.paypal.com/search?q={query}",
    "venmo": "https://venmo.com/search?q={query}",
    "coinbase": "https://www.coinbase.com/search?q={query}",
    "binance": "https://www.binance.com/en/search?q={query}",
    "robinhood": "https://robinhood.com/search/{query}",
    "yahoo_finance": "https://finance.yahoo.com/quote/{query}",
    "bloomberg": "https://www.bloomberg.com/search?query={query}",
    
    # HEALTH & FITNESS
    "webmd": "https://www.webmd.com/search/search_results/default.aspx?query={query}",
    "healthline": "https://www.healthline.com/search?q={query}",
    "myfitnesspal": "https://www.myfitnesspal.com/food/search?search={query}",
    "strava": "https://www.strava.com/athletes/search?q={query}",
    "fitbit": "https://www.fitbit.com/search?q={query}",
    
    # ENTERTAINMENT & GAMING
    "imdb": "https://www.imdb.com/find?q={query}",
    "rotten_tomatoes": "https://www.rottentomatoes.com/search?search={query}",
    "metacritic": "https://www.metacritic.com/search/{query}/",
    "steam": "https://store.steampowered.com/search/?term={query}",
    "epic_games": "https://www.epicgames.com/store/en-US/browse?q={query}",
    "xbox": "https://www.xbox.com/en-US/search?q={query}",
    "playstation": "https://www.playstation.com/en-us/search/?q={query}",
    "nintendo": "https://www.nintendo.com/search/?q={query}",
    "twitch_gaming": "https://www.twitch.tv/directory/game/{query}",
    
    # GOVERNMENT & OFFICIAL
    "irs": "https://www.irs.gov/search?q={query}",
    "ssa": "https://www.ssa.gov/search/?q={query}",
    "usa_gov": "https://www.usa.gov/search?query={query}",
    "who": "https://www.who.int/search?q={query}",
    "cdc": "https://www.cdc.gov/search/index.html?query={query}",
    
    # ADDITIONAL CATEGORIES
    "craigslist": "https://craigslist.org/search/?query={query}",
    "fiverr": "https://www.fiverr.com/search/gigs?query={query}",
    "upwork": "https://www.upwork.com/search/jobs/?q={query}",
    "indeed": "https://www.indeed.com/jobs?q={query}",
    "monster": "https://www.monster.com/jobs/search/?q={query}",
    "glassdoor": "https://www.glassdoor.com/Search/results.htm?keyword={query}",
    "dribbble": "https://dribbble.com/search/{query}",
    "behance": "https://www.behance.net/search?search={query}",
    "flickr": "https://www.flickr.com/search/?text={query}",
    "imgur": "https://imgur.com/search?q={query}",
    "deviantart": "https://www.deviantart.com/search?q={query}"
}