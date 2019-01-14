function initList() {
  fetch('./books.json')
    .then(response => response.json())
    .then(booksJSON => {
      const container = document.getElementById('container');

      function createItem(container) {
        const link = document.createElement('a');
        link.className = 'list-item-link';

        const authors = document.createElement('span');
        authors.className = 'list-item-authors';

        const description = document.createElement('p');
        description.className = 'list-item-description';

        container.appendChild(link);
        container.appendChild(authors);
        container.appendChild(description);
      }

      function updateItem(container, index) {
        const bookJSON = booksJSON[index];

        // For visual debugging
        container.setAttribute('data-title', bookJSON.title);

        const link = container.querySelector('.list-item-link');
        link.href = `https://www.amazon.com/s/ref=nb_sb_noss?url=search-alias%3Daps&field-keywords=${escape(bookJSON.title)}`
        link.text = bookJSON.title;

        const authors = container.querySelector('.list-item-authors');
        authors.innerText = ` by ${bookJSON.authors.join(', ')}`;

        const description = container.querySelector('.list-item-description');
        description.innerText = bookJSON.longDescription || bookJSON.shortDescription || '';
        description.style.setProperty('display', description.innerText ? 'block' : 'none');
      }

      createList(container, booksJSON.length, createItem, updateItem);
    });
}