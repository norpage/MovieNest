// Register Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then((registration) => {
            console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
            console.error('Service Worker registration failed:', error);
        });
}

// Show/Hide Loading Spinner
function showLoading() {
    document.getElementById("loading").style.display = "block";
}

function hideLoading() {
    document.getElementById("loading").style.display = "none";
}

// Debounced Search
let timeout;
document.getElementById("searchInput").addEventListener("input", () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        document.getElementById("searchForm").dispatchEvent(new Event("submit"));
    }, 300);
});

// Rest of your JavaScript remains the same

window.addEventListener('load', async function () {
    const resultDiv = document.getElementById("result");
    const bestMoviesUrl = "https://corsproxy.io/https://kinogo.ec/";
    const iframe = document.getElementById("filmFrame");
    const trailerP = document.querySelector('.trailer')

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
                    fetch(`https://corsproxy.io/${item.url}`)
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
                                } else {
                                    console.error('data-src attribute not found in <li>');
                                }
                            } else {
                                console.error('Element with data-provider="2" not found');
                            }
                        })
                        .catch(error => {
                            console.error('Error fetching details:', error);
                        });
                });
            });
        }
    } catch (error) {
        resultDiv.innerHTML = "An error occurred while fetching the best movies.";
    }
});
