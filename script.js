window.addEventListener('load', async function () {
    const resultDiv = document.getElementById("result");
    const bestMoviesUrl = "https://api.allorigins.win/raw?url=https://kinogo.ec/";
    const iframe = document.getElementById("filmFrame");
    const trailerP = document.querySelector('.trailer')

    if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/MovieNest/service-worker.js')
        .then(() => {
        })
        .catch(() => {
        });
}

    try {
        const res = await fetch(bestMoviesUrl);
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const carouselItems = doc.querySelector('.carousel__items');

        if (carouselItems) {
            const items = Array.from(carouselItems.children).map(item => {
                const titleWithYear = item.title;
                const img = item.innerHTML;
                const url = item.href;

                const regex = /src="([^"]+)"/;
                const match = img.match(regex);
                const imageUrl = match ? match[1] : null;

                const titleYearRegex = /^(.*)\s\((\d{4})\)$/;
                const matchTitleYear = titleWithYear.match(titleYearRegex);
                const title = matchTitleYear ? matchTitleYear[1] : titleWithYear;
                const year = matchTitleYear ? matchTitleYear[2] : null;

                return { title, year, url, img: imageUrl };
            });

            items.forEach(item => {
                const card = document.createElement("div");
                card.classList.add('movie-card');
                card.innerHTML = `
                            <img src="https://kinogo.ec/${item.img}" alt="${item.title}">
                            <div class="movie-info">
                                <div class="movie-title">${item.title}</div>
                                <div class="movie-year">${item.year}</div>
                            </div>`;
                resultDiv.appendChild(card);
                document.querySelector('.resultName').textContent = "Top Movies"


                card.addEventListener('click', () => {

                    fetch(`https://api.allorigins.win/raw?url=${item.url}`)
                        .then(response => response.text())
                        .then(pageHtml => {
                            const pageDoc = new DOMParser().parseFromString(pageHtml, 'text/html');

                            const liElement = pageDoc.querySelector('li[data-provider="2"]');
                            const trailer = pageDoc.querySelector('.video__trailer');

                            if (liElement) {
                                const iframeSrc = liElement.getAttribute('data-src');
                                const trail = trailer.getAttribute('data-src');

                                if (iframeSrc) {
                                    document.querySelector('.name').textContent = item.title
                                    iframe.src = iframeSrc;
                                    iframe.style.display = 'block'
                                    document.getElementById("closeFilm").style.display='block'
                                    document.querySelector('.divDow').style.display='block'
                                    trailerP.textContent = "Trailer"
                                    trailerP.style.display = 'block'
                                    localStorage.setItem("selectedURL", iframeSrc);
                                    localStorage.setItem("selectedName", item.title);
                                    trailerP.addEventListener('click', () => {

                                        if (trailerP.textContent === "Movie") {
                                            iframe.src = iframeSrc;
                                            trailerP.textContent = "Trailer"

                                        } else {
                                            iframe.src = trail;
                                            trailerP.textContent = "Movie"
                                        }

                                    })
                                    fetchTitleAndHLS(iframeSrc)
                                    localStorage.removeItem("selectedNumber")
                                }
                            }
                        })
                });
            });
        }
    } catch (error) {
        resultDiv.innerHTML = "An error occurred while fetching the best movies.";
    }
});

document.getElementById("closeFilm").addEventListener("click", async function (e) {
    e.preventDefault();
    localStorage.clear()
    document.querySelector('.divDow').style.display='none'
    document.getElementById("filmFrame").style.display='none'
    document.getElementById("closeFilm").style.display='none'

})
document.getElementById("searchForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const input = document.getElementById("searchInput").value.trim();
    const resultDiv = document.getElementById("result");
    const iframe = document.getElementById("filmFrame");
    const downloadLink = document.getElementById("downloadLink");
    const searchButton = document.getElementById("searchButton");
    const loadingGif=document.getElementById("loadingGif")


    downloadLink.style.display = "none";
    document.querySelector('.trailer').style.display = 'none'
    searchButton.disabled = true;
    searchButton.textContent = "Searching...";
    searchButton.style.cursor = "wait";
    loadingGif.style.display='block'
    document.querySelector('.resultName').textContent = "Loading Please Wait..."



    if (/^\d+$/.test(input) || input.includes("kinopoisk")) {
        const number = input.match(/\d+/)[0];
        iframe.src = `https://ddbb.lol?id=${number}&n=0`;
        iframe.style.display = 'block'
        document.getElementById("closeFilm").style.display='block'
        document.querySelector('.divDow').style.display='block'
        localStorage.setItem("selectedNumber", number);
        localStorage.removeItem("selectedURL")
        localStorage.removeItem("selectedName")


        fetchTitleAndHLS(+number);
    } else {
        const searchUrl = `https://www.kinopoisk.ru/index.php?kp_query=${encodeURIComponent(input)}`;
        const proxyUrl = 'https://api.allorigins.win/raw?url=';

        try {
            resultDiv.innerHTML = "";

            const res = await fetch(proxyUrl + searchUrl);
            if (!res.ok) throw new Error(`Request failed with status ${res.status}`);

            const html = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");

            const searchResults = doc.querySelectorAll(".search_results .element");
            if (searchResults.length === 0) {
                document.querySelector('.resultName').textContent = "Search Results"
                resultDiv.innerHTML = "No results found.";
                searchButton.disabled = false;
                searchButton.textContent = "Search";
                searchButton.style.cursor = "pointer";
                loadingGif.style.display='none'

                return;
            }

            resultDiv.innerHTML = "";

            searchResults.forEach((result) => {
                const titleElement = result.querySelector(".name a.js-serp-metrika");
                const yearElement = result.querySelector(".year");
                const durationElement = result.querySelector(".gray");

                if (titleElement) {
                    const dataId = titleElement.getAttribute("data-id");

                    const card = document.createElement("div");
                    card.className = "movie-card";
                    card.innerHTML = `
                <img src="https://www.kinopoisk.ru/images/sm_film/${dataId}.jpg" alt="${titleElement.textContent.trim()}">
                <div class="movie-info">
                    <div class="movie-title">${titleElement.textContent.trim()}</div>
                    <div class="movie-year">${yearElement?.textContent || "Unknown Year"}</div>
                    <div class="movie-duration">${durationElement?.textContent || ""}</div>
                </div>`;
                    document.querySelector('.resultName').textContent = "Search Results"
                    loadingGif.style.display='none'
                    document.querySelector('.trailer').style.display = 'none'

                    card.addEventListener("click", function () {
                        iframe.src = `https://ddbb.lol?id=${dataId}&n=0`;
                        iframe.style.display = 'block'
                        document.getElementById("closeFilm").style.display='block'
                        document.querySelector('.divDow').style.display='block'
                        localStorage.setItem("selectedNumber", dataId);
                        localStorage.removeItem("selectedURL")
                        localStorage.removeItem("selectedName")

                        fetchTitleAndHLS(+dataId);
                    });

                    resultDiv.appendChild(card);
                }
            });
        } catch (error) {
            loadingGif.style.display='none'
            document.querySelector('.resultName').textContent = "Ooops Please Reload Page!"
            document.getElementById("filmFrame").style.display="none"
            document.querySelector('.notFound').style.display = "block"

        }

    }
    searchButton.disabled = false;
    searchButton.textContent = "Search";
    searchButton.style.cursor = "pointer";
});

function loadFilmFromLocalStorage() {
    const savedNumber = localStorage.getItem("selectedNumber");
    const savedUrl = localStorage.getItem("selectedURL");
    const savedName = localStorage.getItem("selectedName")

    if (savedNumber) {
        const iframe = document.getElementById("filmFrame");
        iframe.src = `https://ddbb.lol?id=${savedNumber}&n=0`;
        iframe.style.display = 'block'
        document.getElementById("closeFilm").style.display='block'
        document.querySelector('.divDow').style.display='block'
        fetchTitleAndHLS(+savedNumber);
    }
    if (savedUrl) {
        const iframe = document.getElementById("filmFrame");
        document.querySelector('.name').textContent = savedName
        iframe.src = savedUrl;
        iframe.style.display = 'block'
        document.getElementById("closeFilm").style.display='block'
        document.querySelector('.divDow').style.display='block'
        fetchTitleAndHLS(savedUrl)

    }
}


window.addEventListener("load", loadFilmFromLocalStorage);

async function fetchTitleAndHLS(extractedNumber) {
    const apiUrl = `https://kinobox.tv/api/players?kinopoisk=${extractedNumber}&sources=turbo%2Ccollaps%2Calloha%2Cvibix%2Cvideocdn%2Chdvb%2Ckodik`;
    try {
        let iframeUrl = '';
        if (typeof extractedNumber === "number") {
            const res = await fetch(apiUrl);
            if (!res.ok) {
                throw new Error(`Request failed: ${res.status}`);
            }

            const data = await res.json();

            iframeUrl = data[1]?.translations?.[0]?.iframeUrl;
        } else {
            iframeUrl = extractedNumber;
        }

        if (iframeUrl) {
            const response = await fetch(iframeUrl,{
                     mode: 'cors',
                     credentials: 'include'
                    });
            if (!response.ok) {
                throw new Error(`Request failed: ${response.status}`);
            }

            const html = await response.text();

            const titleMatch = html.match(/<title>(.*?)<\/title>/);
            let encodedName = '';
            if (titleMatch) {
                document.querySelector('.name').textContent = titleMatch[1];
                document.title = titleMatch[1];
                encodedName = encodeURIComponent(titleMatch[1]);
            }

            const hlsRegex = /https?:\/\/[^\s"]+\.m3u8[^\s"]*/;
            const hlsLink = html.match(hlsRegex);
            let encodedHls = '';
            if (hlsLink) {
                encodedHls = encodeURIComponent(hlsLink[0]);
            }

            if (encodedName && encodedHls) {
                const downloadUrl = `https://fazhzcezbdi.showvid.ws/x-px/video-download?m=${encodedHls}&name=${encodedName}`;
                const downloadLink = document.getElementById('downloadLink');
                downloadLink.href = downloadUrl;
                downloadLink.style.display = 'block';
            }
        }
    } catch (error) {
    }
}
