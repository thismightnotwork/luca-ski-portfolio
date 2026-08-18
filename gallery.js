const owner = 'thismightnotwork';
const repo = 'luca-ski-portfolio';
const branch = 'main';
const directory = 'photos';
const allowedExtensions = /\.(avif|gif|jpe?g|png|webp)$/i;

const gallery = document.getElementById('photo-gallery');

function renderEmpty(message) {
  gallery.innerHTML = `<div class="gallery-item gallery-empty">${message}</div>`;
}

function renderPhotos(files) {
  const images = files
    .filter(file => file.type === 'file' && allowedExtensions.test(file.name))
    .sort((a, b) => b.name.localeCompare(a.name));

  if (!images.length) {
    renderEmpty('Add skiing photos to the <code>photos/</code> folder and they will appear here automatically.');
    return;
  }

  gallery.innerHTML = images.map(file => `
    <figure class="gallery-item">
      <img src="${file.download_url}" alt="Luca Finnis-Bernard skiing — ${file.name.replace(/[-_]/g, ' ').replace(/\.[^.]+$/, '')}" loading="lazy">
    </figure>
  `).join('');
}

async function loadGallery() {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${directory}?ref=${branch}`, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store'
    });

    if (response.status === 404) {
      renderEmpty('Add skiing photos to the <code>photos/</code> folder and they will appear here automatically.');
      return;
    }

    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    renderPhotos(await response.json());
  } catch (error) {
    renderEmpty('The gallery could not load right now. Please refresh in a moment.');
    console.error('Unable to load photo gallery:', error);
  }
}

loadGallery();
setInterval(loadGallery, 60000);
