'use strict';

/**
 * Bookshelf App Frontend Integration with Bookshelf API
 * Renders books and supports add/search/toggle/edit/delete via API.
 */


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

/** Local storage key for frontend-only bookshelf data. */
const STORAGE_KEY = 'bookshelf_books';

/**
 * Load books array from localStorage.
 * @return {Array<Object>}
 */
function loadBooks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
}

/**
 * Persist books array to localStorage.
 * @param {Array<Object>} books
 */
function saveBooks(books) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

/**
 * Generate a simple unique id.
 * @return {string}
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

  // Toggle finished using localStorage
  toggleBtn.addEventListener('click', async () => {
    const books = loadBooks();
    const idx = books.findIndex((b) => b.id === book.id);
    if (idx !== -1) {
      books[idx].finished = !books[idx].finished;
      saveBooks(books);
      const q = els.searchTitleInput.value.trim();
      await renderLists(q);
    }
  });

  // Delete using localStorage
  deleteBtn.addEventListener('click', async () => {
    const ok = confirm('Apakah Anda yakin ingin menghapus buku ini?');
    if (!ok) return;
    const books = loadBooks().filter((b) => b.id !== book.id);
    saveBooks(books);
    const q = els.searchTitleInput.value.trim();
    await renderLists(q);
  });

  // Inline edit: update localStorage
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
      const parsedYear = Number(newYearRaw);
      const newYear = parsedYear || book.year || new Date().getFullYear();

      const books = loadBooks();
      const idx = books.findIndex((b) => b.id === book.id);
      if (idx !== -1) {
        books[idx].name = newTitle || book.name;
        books[idx].author = newAuthor || book.author;
        books[idx].year = newYear;
        saveBooks(books);
        const q = els.searchTitleInput.value.trim();
        await renderLists(q);
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
    const books = loadBooks();
    const q = (searchTerm || '').trim().toLowerCase();
    let listToShow = books;
    if (q) {
      listToShow = books.filter((b) => {
        return (b.name || '').toLowerCase().includes(q);
      });
    }

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

  const newBook = {
    id: generateId(),
    name,
    author,
    year,
    finished: isComplete,
  };

  const books = loadBooks();
  books.push(newBook);
  saveBooks(books);

  els.titleInput.value = '';
  els.authorInput.value = '';
  els.yearInput.value = '';
  els.isCompleteCheckbox.checked = false;
  setSubmitButtonText();
  await renderLists(els.searchTitleInput.value.trim());
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
