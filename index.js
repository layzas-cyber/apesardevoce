// CONFIGURAÇÃO DO SUBSTACK
// Substitua o link abaixo pelo URL completo do seu Substack
const SUBSTACK_URL = 'https://vozeverso.substack.com'; 

// URL para conversão do Feed RSS do Substack em JSON (Resolve CORS e converte o XML)
const SUBSTACK_RSS_FEED = `${SUBSTACK_URL}/feed`;
const RSS_API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(SUBSTACK_RSS_FEED)}`;

// BASE DE DADOS DINÂMICA
let noticiasDB = [];
let visibleNewsCount = 3;

// FUNÇÃO PARA BUSCAR POSTAGENS DO SUBSTACK
async function carregarNoticiasSubstack() {
    const container = document.getElementById('news-container');
    container.innerHTML = '<p class="loading-text" style="grid-column: 1/-1; text-align: center; color: #666;">A carregar notícias do Substack...</p>';

    try {
        const response = await fetch(RSS_API_URL);
        const data = await response.json();

        if (data.status === 'ok' && data.items && data.items.length > 0) {
            // Mapeia os dados do Substack para o formato do seu site
            noticiasDB = data.items.map((item, index) => {
                // Tenta extrair a imagem de capa do conteúdo da postagem ou do cabeçalho
                let imagemCapa = item.thumbnail || item.enclosure?.link;
                
                if (!imagemCapa) {
                    // Busca por tags <img> dentro do conteúdo HTML da notícia
                    const imgMatch = item.content ? item.content.match(/<img[^>]+src="([^">]+)"/) : null;
                    imagemCapa = imgMatch ? imgMatch[1] : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600'; // Imagem padrão
                }

                // Formatador de data
                const dataPublicacao = new Date(item.pubDate).toLocaleDateString('pt-PT', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });

                // Limpeza do resumo (extrai apenas texto puro sem tags HTML)
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = item.description || item.content;
                const textoPuro = tempDiv.textContent || tempDiv.innerText || '';
                const resumoLimpo = textoPuro.substring(0, 140).trim() + '...';

                return {
                    id: index + 1,
                    categoria: item.categories && item.categories.length > 0 ? item.categories[0] : 'Substack',
                    data: dataPublicacao,
                    titulo: item.title,
                    resumo: resumoLimpo,
                    conteudo: item.content,
                    imagem: imagemCapa,
                    linkOriginal: item.link
                };
            });

            renderNoticias();
        } else {
            throw new Error('Não foi possível obter artigos do Substack.');
        }
    } catch (error) {
        console.error('Erro ao carregar o feed do Substack:', error);
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #c2003b;">Não foi possível carregar as notícias mais recentes. Tente novamente mais tarde.</p>';
    }
}

// RENDERIZAÇÃO DAS NOTÍCIAS
function renderNoticias() {
    const container = document.getElementById('news-container');
    container.innerHTML = '';

    if (noticiasDB.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Nenhuma notícia encontrada.</p>';
        return;
    }

    const noticiasParaExibir = noticiasDB.slice(0, visibleNewsCount);

    noticiasParaExibir.forEach(noticia => {
        const card = document.createElement('article');
        card.className = 'news-card';
        card.innerHTML = `
            <img src="${noticia.imagem}" alt="${noticia.titulo}" class="news-card-img" loading="lazy">
            <div class="news-card-body">
                <span class="news-tag">${noticia.categoria}</span>
                <h3>${noticia.titulo}</h3>
                <p>${noticia.resumo}</p>
                <div class="news-card-footer">
                    <span class="news-date">${noticia.data}</span>
                    <button onclick="abrirNoticia(${noticia.id})" class="btn-read-more">Ler notícia completa →</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    const btnLoadMore = document.getElementById('loadMoreNews');
    if (btnLoadMore) {
        if (visibleNewsCount >= noticiasDB.length) {
            btnLoadMore.style.display = 'none';
        } else {
            btnLoadMore.style.display = 'inline-block';
        }
    }
}

// BOTÃO "CARREGAR MAIS"
const btnLoadMore = document.getElementById('loadMoreNews');
if (btnLoadMore) {
    btnLoadMore.addEventListener('click', () => {
        visibleNewsCount += 3;
        renderNoticias();
    });
}

// MODAL DE LEITURA
function abrirNoticia(id) {
    const noticia = noticiasDB.find(n => n.id === id);
    if (!noticia) return;

    document.getElementById('modalCategory').textContent = noticia.categoria;
    document.getElementById('modalTitle').textContent = noticia.titulo;
    document.getElementById('modalDate').textContent = noticia.data;

    // Adiciona o conteúdo e um botão no final para o utilizador poder ler diretamente no Substack se quiser
    const modalContent = `
        ${noticia.conteudo}
        <hr style="margin: 30px 0 20px 0; border: 0; border-top: 1px solid #eee;">
        <p style="text-align: center;">
            <a href="${noticia.linkOriginal}" target="_blank" rel="noopener noreferrer" style="color: #c2003b; font-weight: bold; text-decoration: underline;">
                Ver publicação original diretamente no Substack ↗
            </a>
        </p>
    `;

    document.getElementById('modalBody').innerHTML = modalContent;

    const modal = document.getElementById('newsModal');
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }
}

const btnCloseModal = document.getElementById('closeNewsModal');
if (btnCloseModal) {
    btnCloseModal.addEventListener('click', () => {
        const modal = document.getElementById('newsModal');
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    });
}

// CARROSSEL HERO
let currentHeroSlide = 0;
const slides = document.querySelectorAll('.hero-slide');
const dotsContainer = document.getElementById('heroDots');

function initHeroCarousel() {
    if (!dotsContainer || slides.length === 0) return;
    
    dotsContainer.innerHTML = '';
    slides.forEach((_, idx) => {
        const dot = document.createElement('button');
        dot.className = `dot ${idx === 0 ? 'active' : ''}`;
        dot.addEventListener('click', () => setHeroSlide(idx));
        dotsContainer.appendChild(dot);
    });
}

function setHeroSlide(index) {
    if (slides.length === 0) return;
    slides[currentHeroSlide].classList.remove('active');
    if (dotsContainer.children[currentHeroSlide]) {
        dotsContainer.children[currentHeroSlide].classList.remove('active');
    }
    
    currentHeroSlide = index;
    slides[currentHeroSlide].classList.add('active');
    if (dotsContainer.children[currentHeroSlide]) {
        dotsContainer.children[currentHeroSlide].classList.add('active');
    }
}

const btnHeroNext = document.getElementById('heroNext');
if (btnHeroNext) {
    btnHeroNext.addEventListener('click', () => {
        let next = (currentHeroSlide + 1) % slides.length;
        setHeroSlide(next);
    });
}

const btnHeroPrev = document.getElementById('heroPrev');
if (btnHeroPrev) {
    btnHeroPrev.addEventListener('click', () => {
        let prev = (currentHeroSlide - 1 + slides.length) % slides.length;
        setHeroSlide(prev);
    });
}

// MENU HAMBURGER MOBILE
const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });
}

// INICIALIZAÇÃO DA PÁGINA
document.addEventListener('DOMContentLoaded', () => {
    initHeroCarousel();
    carregarNoticiasSubstack(); // Procura automaticamente os dados atualizados do Substack
});