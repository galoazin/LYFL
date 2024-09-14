const apiKey = 'AIzaSyDwAL421-0OiMJi8KZg6nITlg4EQ8Bh7js'; // Reemplaza con tu clave de API
const maxResults = 10;
let currentGenre = 'todos';
let currentLanguage = ''; // Se establecerá en 'es' o 'en'
let nextPageToken = ''; // Almacena el token para la siguiente página

// Almacena los videos obtenidos
let videos = [];

// Referencia al botón y contenedor "Cargar más videos"
const loadMoreContainer = document.getElementById('loadMoreContainer');
const loadMoreButton = document.getElementById('loadMoreButton');

// Función para obtener videos de YouTube
async function fetchVideos(query, language, pageToken = '') {
    try {
        // Construir los parámetros de búsqueda
        let searchParams = new URLSearchParams({
            key: apiKey,
            part: 'snippet',
            type: 'video',
            maxResults: maxResults,
            q: query,
            safeSearch: 'strict',
            order: 'relevance',
            relevanceLanguage: language,
            regionCode: 'US' // Puedes cambiarlo según tus necesidades
        });

        if (pageToken) {
            searchParams.append('pageToken', pageToken);
        }

        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`);
        const data = await response.json();
        
        // Añadir console.log para verificar la respuesta
        console.log('Respuesta de la API:', data);

        // Almacenar el nextPageToken
        nextPageToken = data.nextPageToken;

        // Filtrar videos por idioma del título o descripción (opcional)
        let filteredItems = data.items.filter(item => {
            const titleLang = detectLanguage(item.snippet.title);
            const descLang = detectLanguage(item.snippet.description);
            return titleLang === language || descLang === language;
        });

        return filteredItems.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.high.url,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            genre: currentGenre
        }));
    } catch (error) {
        console.error('Error al obtener los videos:', error);
        return [];
    }
}

// Función para detectar el idioma (simplificada)
function detectLanguage(text) {
    const spanishChars = /[ñáéíóúüÑÁÉÍÓÚÜ]/;
    if (spanishChars.test(text)) {
        return 'es';
    } else {
        return 'en';
    }
}

async function loadVideos(query = '', language = 'es') {
    videos = await fetchVideos(query, language);
    displayVideos(videos);

    // Mostrar o esconder el botón "Cargar más"
    if (nextPageToken) {
        loadMoreContainer.style.display = 'block';
    } else {
        loadMoreContainer.style.display = 'none';
    }
}

function displayVideos(videosToDisplay) {
    const videosContainer = document.getElementById('videosContainer');
    videosContainer.innerHTML = '';

    if (videosToDisplay.length === 0) {
        videosContainer.innerHTML = '<p>No se encontraron videos.</p>';
        loadMoreContainer.style.display = 'none';
        return;
    }

    videosToDisplay.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.classList.add('video-card');

        videoCard.innerHTML = `
            <div class="video-thumbnail">
                <img src="${video.thumbnail}" alt="${video.title}">
                <a href="${video.url}" target="_blank" class="play-button"><i class="fas fa-play-circle"></i></a>
            </div>
            <div class="video-info">
                <h3>${video.title}</h3>
                <p>${video.description}</p>
            </div>
        `;

        videosContainer.appendChild(videoCard);
    });
}

// Función para cargar más videos
async function loadMoreVideos() {
    const additionalVideos = await fetchVideos(getQueryForGenre(currentGenre), currentLanguage, nextPageToken);
    displayAdditionalVideos(additionalVideos);

    // Mostrar o esconder el botón "Cargar más"
    if (nextPageToken) {
        loadMoreContainer.style.display = 'block';
    } else {
        loadMoreContainer.style.display = 'none';
    }
}

// Función para mostrar los videos adicionales
function displayAdditionalVideos(videosToDisplay) {
    const videosContainer = document.getElementById('videosContainer');

    if (videosToDisplay.length === 0) {
        loadMoreContainer.style.display = 'none';
        return;
    }

    videosToDisplay.forEach(video => {
        const videoCard = document.createElement('div');
        videoCard.classList.add('video-card');

        videoCard.innerHTML = `
            <div class="video-thumbnail">
                <img src="${video.thumbnail}" alt="${video.title}">
                <a href="${video.url}" target="_blank" class="play-button"><i class="fas fa-play-circle"></i></a>
            </div>
            <div class="video-info">
                <h3>${video.title}</h3>
                <p>${video.description}</p>
            </div>
        `;

        videosContainer.appendChild(videoCard);
    });
}

async function filterVideosByGenre(genre) {
    currentGenre = genre;
    // Mostrar la selección de idioma al seleccionar un subgénero
    if (genre !== 'todos') {
        document.getElementById('languageSelection').classList.add('show');
    } else {
        document.getElementById('languageSelection').classList.remove('show');
    }
    // Cargar los videos del género y idioma actuales
    if (currentLanguage) {
        await loadVideos(getQueryForGenre(currentGenre), currentLanguage);
    } else {
        // Esperar a que el usuario seleccione un idioma
        document.getElementById('videosContainer').innerHTML = '<p>Selecciona un idioma para ver los videos.</p>';
    }
}

async function searchVideos(query) {
    if (query.trim() === '') {
        await filterVideosByGenre(currentGenre);
    } else {
        await loadVideos(query, currentLanguage || 'es');
    }
}

// Eventos para los botones de género
const genreButtons = document.querySelectorAll('.genre-btn');
genreButtons.forEach(button => {
    button.addEventListener('click', async () => {
        // Remover la clase 'active' de todos los botones
        genreButtons.forEach(btn => btn.classList.remove('active'));
        // Añadir la clase 'active' al botón clickeado
        button.classList.add('active');
        const genre = button.getAttribute('data-genre');
        searchInput.value = ''; // Limpiar el campo de búsqueda
        await filterVideosByGenre(genre);
    });
});

// Evento para el input de búsqueda
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', async () => {
    const query = searchInput.value;
    await searchVideos(query);
});

// Eventos para las banderas de idioma
const flagIcons = document.querySelectorAll('.flag-icon');
flagIcons.forEach(flag => {
    flag.addEventListener('click', async () => {
        // Remover 'active' de todas las banderas
        flagIcons.forEach(f => f.classList.remove('active'));
        // Añadir 'active' a la bandera seleccionada
        flag.classList.add('active');
        currentLanguage = flag.getAttribute('data-lang');
        // Cargar los videos en el idioma seleccionado
        await loadVideos(getQueryForGenre(currentGenre), currentLanguage);
    });
});

// Evento para el botón "Cargar más videos"
loadMoreButton.addEventListener('click', async () => {
    if (nextPageToken) {
        await loadMoreVideos();
    }
});

// Función para obtener la consulta según el género
function getQueryForGenre(genre) {
    let query = '';

    switch (genre) {
        case 'autoestima':
            query = 'self-esteem';
            break;
        case 'desamor':
            query = 'desamor motivación';
            break;
        case 'emprendimiento':
            query = 'entrepreneurship';
            break;
        case 'espiritualidad':
            query = 'spirituality';
            break;
        case 'estoicismo':
            query = 'stoicism';
            break;
        case 'exito-profesional':
            query = 'professional success';
            break;
        case 'hopecore':
            query = 'hopecore';
            break;
        case 'mindfulness':
            query = 'mindfulness';
            break;
        case 'motivacion-deportiva':
            query = 'sports motivation';
            break;
        case 'motivacion-estudiantes':
            query = 'student motivation';
            break;
        case 'motivacion-gym':
            query = 'gym motivation';
            break;
        case 'positividad':
            query = 'positivity';
            break;
        case 'productividad':
            query = 'productivity';
            break;
        case 'resiliencia':
            query = 'resilience';
            break;
        case 'salud-mental':
            query = 'mental health';
            break;
        case 'superacion':
            query = 'personal improvement';
            break;
        case 'superacion-personal':
            query = 'self-improvement';
            break;
        // Añade más casos según tus géneros
        default:
            query = 'videos de motivación';
            break;
    }

    // Agregar términos específicos según el idioma
    if (currentLanguage === 'es') {
        query += ' en español';
    } else if (currentLanguage === 'en') {
        query += ' in english';
    }

    return query;
}

// Función para actualizar el contador de tiempo
function updateTime() {
    const timeDisplay = document.getElementById('timeDisplay');
    const now = new Date();
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
    };
    // Utilizar la configuración regional del navegador del usuario
    const formattedTime = now.toLocaleDateString(undefined, options);
    timeDisplay.textContent = formattedTime;
}

// Función para el contador interactivo
let counterValue = 5000; // Valor inicial del contador
function updateCounter() {
    const peopleCounter = document.getElementById('peopleCounter');
    counterValue += Math.floor(Math.random() * 5); // Incremento aleatorio
    peopleCounter.textContent = counterValue.toLocaleString();
}

// Actualizar el tiempo cada segundo
setInterval(updateTime, 1000);

// Actualizar el contador cada 3 segundos
setInterval(updateCounter, 3000);

// Cargar videos al cargar la página y actualizar el tiempo y contador
document.addEventListener('DOMContentLoaded', async () => {
    // Ocultar la selección de idioma al cargar la página
    document.getElementById('languageSelection').classList.remove('show');
    updateTime();
    updateCounter();
    // Cargar el género y el idioma por defecto
    await filterVideosByGenre(currentGenre);
});
