document.addEventListener('DOMContentLoaded', async function() {
    console.log("✅ YGO embed script loaded");
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
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    let lastTapped = null;

    const hoverDiv = document.createElement('div');
    Object.assign(hoverDiv.style, {
      position: 'absolute',
      pointerEvents: 'none',
      zIndex: '9999',
      display: 'none',
      maxWidth: '90vw'
    });
    document.body.appendChild(hoverDiv);
    
    window.addEventListener('scroll', () => {
      if (hoverDiv.style.display === 'block' && lastTapped) {
        const rect = lastTapped.getBoundingClientRect();
        hoverDiv.style.top = `${window.scrollY + rect.bottom + 10}px`;
        hoverDiv.style.left = '50%';
        hoverDiv.style.transform = 'translateX(-50%)';
      }
    });
    
    document.querySelectorAll('p').forEach(p => {
      const match = p.textContent.trim().match(/^embed::(.+)$/i);
      if (match) {
        const cardName = match[1].trim();
        const wrapper = document.createElement('div');
        wrapper.className = 'ygo-card-embed';
        wrapper.setAttribute('data-card-name', cardName);
        wrapper.innerHTML = '<br>';
        p.replaceWith(wrapper);
      }
    });
    
    // Hover preview setup
    function setupHoverPreviews() {
      document.querySelectorAll('.dib-post-content p, .dib-post-content li, .dib-post-content h2, .dib-post-content h3, .dib-post-content h4').forEach(node => {
        node.innerHTML = node.innerHTML.replace(/\[\[([^\]]+)\]\]/g, (_, name) => `<span class="hover-card" data-card-name="${name}">${name}</span>`);
      });
    
      document.querySelectorAll('.hover-card').forEach(elem => {
        elem.style.color = '#d8232f';
        elem.style.fontWeight = 'bold';
        elem.style.cursor = 'pointer';
        elem.style.textDecoration = 'none';
    
        elem.addEventListener('mouseenter', async function (e) {
          if (isMobile) return;
          await loadHover(this.dataset.cardName, e);
        });
    
        elem.addEventListener('mousemove', e => {
          if (!isMobile) positionHover(e);
        });
    
        elem.addEventListener('mouseleave', () => {
          if (isMobile) return;
          hoverDiv.style.display = 'none';
        });
    
        elem.addEventListener('click', async function (e) {
          e.preventDefault();
          const name = this.dataset.cardName;
          if (!cardCache[name]) await loadHover(name, e);
          if (isMobile) {
            if (lastTapped === this) {
              window.open(cardCache[name].imgLarge, '_blank');
              hoverDiv.style.display = 'none';
              lastTapped = null;
            } else {
              lastTapped = this;
              showHover(cardCache[name].imgSmall);
              const rect = this.getBoundingClientRect();
              hoverDiv.style.top = `${window.scrollY + rect.bottom + 10}px`;
              hoverDiv.style.left = '50%';
              hoverDiv.style.transform = 'translateX(-50%)';
            }
          } else {
            window.open(cardCache[name].imgLarge, '_blank');
          }
        });
      });
    }
    
    async function loadHover(name, e) {
      if (cardCache[name]) return showHover(cardCache[name].imgSmall);
      try {
        const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(name)}`);
        const data = await res.json();
        const card = data.data[0];
        cardCache[name] = {
          imgSmall: card.card_images[0].image_url_small,
          imgLarge: card.card_images[0].image_url
        };
        showHover(cardCache[name].imgSmall);
        if (!isMobile) positionHover(e);
      } catch (err) {
        console.error('Error loading hover image:', err);
      }
    }
    
    function showHover(url) {
      hoverDiv.innerHTML = `<img src="${url}" style="width:177px;border-radius:8px;box-shadow:0 4px 8px rgba(0,0,0,0.3);">`;
      hoverDiv.style.display = 'block';
    }
    
    function positionHover(e) {
      const hoverWidth = 200;
      const offset = 15;
      let x = e.clientX + offset;
      let y = e.clientY + offset;
    
      // Prevent going off right edge
      if (x + hoverWidth > window.innerWidth) {
        x = e.clientX - hoverWidth - offset;
      }
    
      // Prevent going off bottom edge
      if (y + 250 > window.innerHeight) {
        y = e.clientY - 250 - offset;
      }
    
      hoverDiv.style.top = `${y + window.scrollY}px`;
      hoverDiv.style.left = `${x + window.scrollX}px`;
      hoverDiv.style.transform = 'none';
    }

    
    setupHoverPreviews();

            // Global tap listener to hide hover if user taps outside a hover-card
    if (isMobile) {
      document.addEventListener('click', (e) => {
        const tappedCard = e.target.closest('.hover-card');
        if (!tappedCard) {
          hoverDiv.style.display = 'none';
          lastTapped = null;
        }
      });
    }
    
    document.querySelectorAll('.ygo-card-embed').forEach(async embedDiv => {
      const cardName = embedDiv.getAttribute('data-card-name');
      const apiUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(cardName)}`;
    
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
    
        const statsHTML = `
          <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:8px;margin-bottom:12px;">
            <div><strong>Type:</strong> ${card.type}</div>
            <div><strong>Attribute:</strong> ${card.attribute || 'N/A'}</div>
            <div><strong>Typing:</strong> ${card.race}</div>
            <div><strong>Level/Rank:</strong> ${card.level || card.rank || 'N/A'}</div>
            <div><strong>ATK:</strong> ${card.atk !== undefined ? card.atk : 'N/A'}</div>
            <div><strong>DEF:</strong> ${card.def !== undefined ? card.def : 'N/A'}</div>
          </div>
        `;
    
        details.innerHTML = `
          <h4 class=\"ygo-card-name\">${card.name}</h4>
          ${statsHTML}
          <p class=\"ygo-card-oracle-text\">${descHTML}</p>
        `;
    
        container.appendChild(details);
        embedDiv.innerHTML = '';
        embedDiv.appendChild(container);
      } catch (err) {
        console.error('Error loading card:', err);
        embedDiv.textContent = 'Error loading card data.';

      }
    });
});
