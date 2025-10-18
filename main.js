'use strict';

/**
 * Bookshelf App Frontend Integration with Bookshelf API
 * Renders books and supports add/search/toggle/edit/delete via API.
 */

const API_BASE = 'http://localhost:5000';

const els = {
  form: document.getElementById('bookForm'),
  titleInput: document.getElementById('bookFormTitle'),
  authorInput: document.getElementById('bookFormAuthor'),
  yearInput: document.getElementById('bookFormYear'),
  isCompleteCheckbox: document.getElementById('bookFormIsComplete'),
  submitButton: document.getElementById('bookFormSubmit'),
  incompleteList: document.getElementById('incompleteBookList'),
  completeList: document.getElementById('completeBookList'),
  searchForm: document.getElementById('searchBook'),
  searchTitleInput: document.getElementById('searchBookTitle'),
};

/** Updates submit button text based on completion checkbox. */
function setSubmitButtonText() {
  const span = els.submitButton.querySelector('span');
  if (!span) return;
  const text = els.isCompleteCheckbox.checked ?
      'Selesai dibaca' :
      'Belum selesai dibaca';
  span.textContent = text;
}

/**
 * Fetch JSON with error handling.
 * @param {string} url
 * @param {RequestInit=} options
 * @return {Promise<any>}
 */
async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: {'Content-Type': 'application/json'},
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data && data.message ? data.message : 'HTTP ' + res.status;
    throw new Error(msg);
  }
  return data;
}

/**
 * Get books summary list filtered by finished.
 * @param {boolean} finished
 * @return {Promise<Array<{id:string,name:string,publisher:string}>>}
 */
async function getBooksByFinished(finished) {
  const url = API_BASE + '/books?finished=' + (finished ? 1 : 0);
  const data = await fetchJSON(url);
  return (data && data.data && data.data.books) || [];
}

/**
 * Get books summary list filtered by name.
 * @param {string} name
 * @return {Promise<Array<{id:string,name:string,publisher:string}>>}
 */
async function getBooksByName(name) {
  const q = encodeURIComponent(name);
  const data = await fetchJSON(API_BASE + '/books?name=' + q);
  return (data && data.data && data.data.books) || [];
}

/**
 * Get book detail.
 * @param {string} id
 * @return {Promise<Object|null>}
 */
async function getBookDetail(id) {
  const data = await fetchJSON(API_BASE + '/books/' + id);
  return (data && data.data && data.data.book) || null;
}

/**
 * Create DOM element for a book item.
 * @param {Object} book
 * @return {HTMLElement}
 */
function createBookElement(book) {
  const container = document.createElement('div');
  container.setAttribute('data-testid', 'bookItem');
  container.setAttribute('data-bookid', book.id);
  container.className = 'book-card';

  const title = document.createElement('h3');
  title.setAttribute('data-testid', 'bookItemTitle');
  title.textContent = book.name;
  title.className = 'book-title';

  const author = document.createElement('p');
  author.setAttribute('data-testid', 'bookItemAuthor');
  author.textContent = 'Penulis: ' + (book.author || '-');
  author.className = 'book-meta';

  const year = document.createElement('p');
  year.setAttribute('data-testid', 'bookItemYear');
  year.textContent = 'Tahun: ' + (book.year || '-');
  year.className = 'book-meta';

  const actions = document.createElement('div');
  actions.className = 'book-actions';

  const toggleBtn = document.createElement('button');
  toggleBtn.setAttribute('data-testid', 'bookItemIsCompleteButton');
  const toggleText = book.finished ? 'Belum selesai dibaca' : 'Selesai dibaca';
  toggleBtn.textContent = toggleText;
  toggleBtn.className = 'btn btn-toggle';

  const deleteBtn = document.createElement('button');
  deleteBtn.setAttribute('data-testid', 'bookItemDeleteButton');
  deleteBtn.textContent = 'Hapus Buku';
  deleteBtn.className = 'btn btn-delete';

  const editBtn = document.createElement('button');
  editBtn.setAttribute('data-testid', 'bookItemEditButton');
  editBtn.textContent = 'Edit Buku';
  editBtn.className = 'btn btn-edit';

  actions.appendChild(toggleBtn);
  actions.appendChild(deleteBtn);
  actions.appendChild(editBtn);

  container.appendChild(title);
  container.appendChild(author);
  container.appendChild(year);
  container.appendChild(actions);

  // Handlers
  toggleBtn.addEventListener('click', async () => {
    try {
      const toComplete = !book.finished;
      const payload = {
        name: book.name,
        year: book.year,
        author: book.author,
        summary: book.summary || '',
        publisher: book.publisher || '',
        pageCount: book.pageCount || 1,
        readPage: toComplete ? (book.pageCount || 1) : 0,
        reading: !toComplete,
      };
      await fetchJSON(API_BASE + '/books/' + book.id, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      await renderLists(els.searchTitleInput.value.trim());
    } catch (e) {
      alert('Gagal mengubah status buku: ' + e.message);
    }
  });

  deleteBtn.addEventListener('click', async () => {
    try {
      await fetchJSON(API_BASE + '/books/' + book.id, {method: 'DELETE'});
      await renderLists(els.searchTitleInput.value.trim());
    } catch (e) {
      alert('Gagal menghapus buku: ' + e.message);
    }
  });

  editBtn.addEventListener('click', () => {
    let form = container.querySelector('[data-testid="bookItemEditForm"]');
    if (form) {
      form.remove();
      return;
    }

    form = document.createElement('form');
    form.setAttribute('data-testid', 'bookItemEditForm');
    form.className = 'book-edit-form';

    const titleLabel = document.createElement('label');
    titleLabel.textContent = 'Judul';
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.value = book.name;

    const authorLabel = document.createElement('label');
    authorLabel.textContent = 'Penulis';
    const authorInput = document.createElement('input');
    authorInput.type = 'text';
    authorInput.value = book.author || '';

    const yearLabel = document.createElement('label');
    yearLabel.textContent = 'Tahun';
    const yearInput = document.createElement('input');
    yearInput.type = 'number';
    yearInput.value = String(book.year || '');

    const actionsRow = document.createElement('div');
    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.textContent = 'Simpan';
    saveBtn.className = 'btn';
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.textContent = 'Batal';
    cancelBtn.className = 'btn';

    actionsRow.appendChild(saveBtn);
    actionsRow.appendChild(cancelBtn);

    form.appendChild(titleLabel);
    form.appendChild(titleInput);
    form.appendChild(authorLabel);
    form.appendChild(authorInput);
    form.appendChild(yearLabel);
    form.appendChild(yearInput);
    form.appendChild(actionsRow);

    container.appendChild(form);

    cancelBtn.addEventListener('click', () => {
      form.remove();
    });

    form.addEventListener('submit', async (evt) => {
      evt.preventDefault();
      const newTitle = titleInput.value.trim();
      const newAuthor = authorInput.value.trim();
      const newYearRaw = yearInput.value.trim();
      const newYear = Number(newYearRaw) ||
          book.year || new Date().getFullYear();

      try {
        const payload = {
          name: newTitle || book.name,
          year: newYear,
          author: newAuthor || book.author,
          summary: book.summary || '',
          publisher: book.publisher || '',
          pageCount: book.pageCount || 1,
          readPage: book.readPage || 0,
          reading: !!book.reading,
        };
        await fetchJSON(API_BASE + '/books/' + book.id, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        await renderLists(els.searchTitleInput.value.trim());
      } catch (e) {
        alert('Gagal mengubah data buku: ' + e.message);
      }
    });
  });

  return container;
}

/**
 * Render lists optionally filtered by search term.
 * @param {string=} searchTerm
 */
async function renderLists(searchTerm = '') {
  els.incompleteList.innerHTML = '';
  els.completeList.innerHTML = '';

  try {
    const listToShow = [];
    if (searchTerm) {
      const byName = await getBooksByName(searchTerm);
      for (const b of byName) {
        const detail = await getBookDetail(b.id);
        if (detail) listToShow.push(detail);
      }
    } else {
      const incomplete = await getBooksByFinished(false);
      for (const b of incomplete) {
        const detail = await getBookDetail(b.id);
        if (detail) listToShow.push(detail);
      }
      const complete = await getBooksByFinished(true);
      for (const b of complete) {
        const detail = await getBookDetail(b.id);
        if (detail) listToShow.push(detail);
      }
    }

    // Render grouped by finished
    for (const book of listToShow) {
      const el = createBookElement(book);
      if (book.finished) {
        els.completeList.appendChild(el);
      } else {
        els.incompleteList.appendChild(el);
      }
    }
  } catch (e) {
    console.error(e);
    alert('Gagal memuat data buku: ' + e.message);
  }
}

/**
 * Handle add-book form submission.
 * @param {Event} evt
 */
async function addBookFromForm(evt) {
  evt.preventDefault();

  const name = els.titleInput.value.trim();
  const author = els.authorInput.value.trim();
  const year = Number(els.yearInput.value) || new Date().getFullYear();
  const isComplete = !!els.isCompleteCheckbox.checked;

  if (!name) {
    alert('Mohon isi nama buku');
    return;
  }

  const payload = {
    name: name,
    year: year,
    author: author,
    summary: '',
    publisher: '',
    pageCount: 1,
    readPage: isComplete ? 1 : 0,
    reading: !isComplete,
  };

  try {
    await fetchJSON(API_BASE + '/books', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    els.titleInput.value = '';
    els.authorInput.value = '';
    els.yearInput.value = '';
    els.isCompleteCheckbox.checked = false;
    setSubmitButtonText();
    await renderLists(els.searchTitleInput.value.trim());
  } catch (e) {
    alert('Gagal menambahkan buku: ' + e.message);
  }
}

/** Initialize DOM events. */
function initEvents() {
  setSubmitButtonText();
  els.isCompleteCheckbox.addEventListener('change', setSubmitButtonText);
  els.form.addEventListener('submit', addBookFromForm);
  els.searchForm.addEventListener('submit', async (evt) => {
    evt.preventDefault();
    await renderLists(els.searchTitleInput.value.trim());
  });
}

/** Bootstrap application. */
async function bootstrap() {
  initEvents();
  await renderLists();
}

// Run on load
bootstrap().catch((e) => console.error('Bootstrap error:', e));
