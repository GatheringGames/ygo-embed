document.addEventListener('DOMContentLoaded', async function() {

    // Inject CSS into the page
    const style = document.createElement('style');
    style.textContent = `
.ygo-embed-container {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-direction: row;
  background-color: #394042;
  border-radius: 8px;
  padding: 16px;
  margin: 16px 0;
  border: 2px solid #5c696d;
  color: #ffffff;
}

@media (max-width: 600px) {
  .ygo-embed-container {
    flex-direction: column;
    align-items: center;
  }
}

.ygo-card-image-container {
  flex: 0 0 auto;
  text-align: center;
}

.ygo-card-image {
  width: 250px;
  height: 364px;
  object-fit: cover;
  cursor: zoom-in;
  border: none;
  display: block;
  margin: 0 auto;
}

.ygo-card-details {
  font-family: Arial, sans-serif;
  line-height: 1.5;
  color: #ffffff;
  flex: 1;
}

.ygo-card-name {
  margin: 0 0 8px;
  font-size: 1.2em;
  color: #ffffff;
}

.ygo-card-type-line,
.ygo-card-oracle-text,
.ygo-card-price {
  margin: 4px 0;
  color: #ffffff;
}

.ygo-card-price {
  font-size: 0.9em;
}

.hover-card {
  color: #d8232f;
  font-weight: bold;
  cursor: pointer;
  text-decoration: none;
}

.hover-card:hover {
  opacity: 0.8;
}
`;
    document.head.appendChild(style);

    const cardCache = {};

    document.querySelectorAll('p').forEach(p => {
      const match = p.textContent.trim().match(/^https:\/\/ygoprodeck\.com\/card\/(?:[\w-]+-)?(\d+)$/i);
      if (match) {
        const wrapper = document.createElement('div');
        wrapper.className = 'ygo-card-embed';
        wrapper.setAttribute('data-card-id', match[1]);
        wrapper.innerHTML = '<br>';
        p.replaceWith(wrapper);
      }
    });


    document.querySelectorAll('.ygo-card-embed').forEach(async embedDiv => {
        const cardId = embedDiv.getAttribute('data-card-id');
        const apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${cardId}`;

        try {
            const res = await fetch(apiUrl);
            const data = await res.json();
            const card = data.data[0];

            const imgUrl = card.card_images[0].image_url;

            const container = document.createElement('div');
            container.className = 'ygo-embed-container';

            const imgContainer = document.createElement('div');
            imgContainer.className = 'ygo-card-image-container';

            const imgLink = document.createElement('a');
            imgLink.href = imgUrl;
            imgLink.target = '_blank';
            imgLink.rel = 'noopener nofollow';

            const img = document.createElement('img');
            img.className = 'ygo-card-image';
            img.src = imgUrl;
            img.alt = card.name;

            imgLink.appendChild(img);
            imgContainer.appendChild(imgLink);
            container.appendChild(imgContainer);

            const details = document.createElement('div');
            details.className = 'ygo-card-details';

            const descHTML = card.desc.replace(/\n/g, '<br><br>');

            details.innerHTML = `
                <h4 class="ygo-card-name">${card.name}</h4>
                <p class="ygo-card-type-line">${card.type}</p>
                <p class="ygo-card-oracle-text">${descHTML}</p>
            `;

            container.appendChild(details);
            embedDiv.innerHTML = '';
            embedDiv.appendChild(container);

        } catch (err) {
            console.error('Error loading card:', err);
            embedDiv.textContent = 'Error loading card data.';
        }
    });

    // Hover functionality
    const hoverDiv = document.createElement('div');
    Object.assign(hoverDiv.style, {
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: '9999',
        display: 'none',
        maxWidth: '90vw'
    });
    document.body.appendChild(hoverDiv);

    document.querySelectorAll('.dib-post-content p, .dib-post-content li, .dib-post-content h2, .dib-post-content h3, .dib-post-content h4').forEach(node => {
        node.innerHTML = node.innerHTML.replace(/\[\[([^\]]+)\]\]/g, (_, name) => `<span class="hover-card" data-card-name="${name}">${name}</span>`);
    });

    document.querySelectorAll('.hover-card').forEach(elem => {
        elem.addEventListener('mouseenter', async function(e) {
            const name = this.dataset.cardName;
            if (!cardCache[name]) {
                const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(name)}`);
                const data = await res.json();
                cardCache[name] = data.data[0].card_images[0].image_url;
            }
            hoverDiv.innerHTML = `<img src="${cardCache[name]}" style="width:223px;border-radius:8px;box-shadow:0 4px 8px rgba(0,0,0,0.3);">`;
            hoverDiv.style.display = 'block';
            hoverDiv.style.top = e.clientY + 15 + 'px';
            hoverDiv.style.left = e.clientX + 15 + 'px';
        });

        elem.addEventListener('mousemove', e => {
            hoverDiv.style.top = e.clientY + 15 + 'px';
            hoverDiv.style.left = e.clientX + 15 + 'px';
        });

        elem.addEventListener('mouseleave', () => {
            hoverDiv.style.display = 'none';
        });

        elem.addEventListener('click', () => {
            window.open(cardCache[elem.dataset.cardName], '_blank');
        });
    });
});
