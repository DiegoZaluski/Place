from playwright.sync_api import sync_playwright
def search(nameSite: str, query:str, headless=True):
    with sync_playwright() as pw:
        Browser = pw.firefox.launch(headless=headless)
        NewContext = Browser.new_context()
        page = NewContext.new_page()
        page.goto("https://www.google.com.br/")
        page.close()

