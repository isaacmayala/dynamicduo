let currentUser = null
let currentSection = 'home'
let currentBook = null
let books = []
let userLists = {
  toRead: [],
  read: [],
}
let reviews = []

// Featured books data (matches your requirements)
const featuredBooks = [
  {
    title: 'The Perfect Day to Boss Up',
    author: 'Neil Martinez-Belkin and Rick Ross',
    key: '/works/OL1234567W',
    cover: null,
    subject: ['Business', 'Success'],
  },
  {
    title: 'Star Wars: Brotherhood',
    author: 'Mike Chen',
    key: '/works/OL2345678W',
    cover: null,
    subject: ['Science Fiction', 'Star Wars'],
  },
  {
    title: 'The Colour of Magic',
    author: 'Terry Pratchett',
    key: '/works/OL3456789W',
    cover: null,
    subject: ['Fantasy', 'Humor'],
  },
  {
    title: "The Keys: They Don't Want You to Read This Book",
    author: 'DJ Khaled',
    key: '/works/OL4567890W',
    cover: null,
    subject: ['Self-help', 'Success'],
  },
  {
    title: 'The Wild Robot Escapes',
    author: 'Peter Brown',
    key: '/works/OL5678901W',
    cover: null,
    subject: ["Children's Fiction", 'Adventure'],
  },
  {
    title: "Harry Potter and the Sorcerer's Stone",
    author: 'J.K. Rowling',
    key: '/works/OL6789012W',
    cover: null,
    subject: ['Fantasy', 'Young Adult'],
  },
  {
    title: 'The Mamba Mentality: How I Play',
    author: 'Kobe Bryant',
    key: '/works/OL7890123W',
    cover: null,
    subject: ['Sports', 'Biography'],
  },
  {
    title: "On Her Game: Caitlin Clark and the Revolution in Women's Sports",
    author: 'Christine Brennan',
    key: '/works/OL8901234W',
    cover: null,
    subject: ['Sports', 'Biography'],
  },
  {
    title: 'Artemis Fowl',
    author: 'Eoin Colfer',
    key: '/works/OL9012345W',
    cover: null,
    subject: ['Young Adult', 'Fantasy'],
  },
  {
    title: 'Going Postal: A Novel of Discworld',
    author: 'Terry Pratchett',
    key: '/works/OL0123456W',
    cover: null,
    subject: ['Fantasy', 'Humor'],
  },
]

// Initialize the application
function init() {
  loadFeaturedBooks()
  checkAuth()

  // Add enter key support for search
  document
    .getElementById('searchInput')
    .addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        searchBooks()
      }
    })
}

// Navigation
function showSection(sectionName) {
  // Hide all sections
  const sections = document.querySelectorAll('.section')
  sections.forEach((section) => section.classList.remove('active'))

  // Show selected section
  document.getElementById(sectionName).classList.add('active')
  currentSection = sectionName

  // Load section-specific data
  if (sectionName === 'lists' && currentUser) {
    loadUserLists()
  } else if (sectionName === 'reviews') {
    loadAllReviews()
  }
}

// Load featured books
function loadFeaturedBooks() {
  const container = document.getElementById('featuredBooks')
  container.innerHTML = ''

  featuredBooks.forEach((book) => {
    const bookCard = createBookCard(book)
    container.appendChild(bookCard)
  })
}

// Search functionality
async function searchBooks() {
  const query = document.getElementById('searchInput').value.trim()
  if (!query) return

  const loadingEl = document.getElementById('searchLoading')
  const resultsEl = document.getElementById('searchResults')

  loadingEl.style.display = 'block'
  resultsEl.innerHTML = ''

  try {
    // Use Open Library Search API
    const response = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`,
    )
    const data = await response.json()

    loadingEl.style.display = 'none'

    if (data.docs && data.docs.length > 0) {
      books = data.docs.map((book) => ({
        title: book.title,
        author: book.author_name
          ? book.author_name.join(', ')
          : 'Unknown Author',
        key: book.key,
        cover: book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
          : null,
        subject: book.subject || [],
        first_publish_year: book.first_publish_year,
        isbn: book.isbn ? book.isbn[0] : null,
      }))

      displayBooks(books, resultsEl)
    } else {
      resultsEl.innerHTML =
        '<div class="message">No books found. Try a different search term.</div>'
    }
  } catch (error) {
    loadingEl.style.display = 'none'
    resultsEl.innerHTML =
      '<div class="message error">Error searching books. Please try again.</div>'
    console.error('Search error:', error)
  }
}

// Display books
function displayBooks(bookList, container) {
  container.innerHTML = ''

  bookList.forEach((book) => {
    const bookCard = createBookCard(book)
    container.appendChild(bookCard)
  })
}

// Create book card element
function createBookCard(book) {
  const card = document.createElement('div')
  card.className = 'book-card fade-in'
  card.onclick = () => showBookDetails(book)

  const coverContent = book.cover
    ? `<img src="${book.cover}" alt="${book.title}" class="book-cover">`
    : `<div class="book-cover">${book.title}</div>`

  const isInToRead = userLists.toRead.some((b) => b.key === book.key)
  const isRead = userLists.read.some((b) => b.key === book.key)

  let actionButtons = ''
  if (currentUser) {
    if (!isInToRead && !isRead) {
      actionButtons += `<button class="btn btn-small btn-primary" onclick="event.stopPropagation(); addToList('toRead', '${book.key}')">Add to Read</button>`
    }
    if (isInToRead) {
      actionButtons += `<button class="btn btn-small btn-outline" onclick="event.stopPropagation(); markAsRead('${book.key}')">Mark as Read</button>`
    }
    if (isRead) {
      actionButtons += `<button class="btn btn-small" style="background: var(--success)" onclick="event.stopPropagation(); writeReview('${book.key}')">Write Review</button>`
    }
  }

  card.innerHTML = `
                ${coverContent}
                <div class="book-info">
                    <div class="book-title">${book.title}</div>
                    <div class="book-author">by ${book.author}</div>
                    <div class="book-actions">
                        ${actionButtons}
                    </div>
                </div>
            `

  return card
}

// Show book details
function showBookDetails(book) {
  currentBook = book
  const modal = document.getElementById('bookModal')
  const content = document.getElementById('bookContent')

  const coverContent = book.cover
    ? `<img src="${book.cover}" alt="${book.title}" style="width: 200px; height: auto; border-radius: 10px; margin-bottom: 1rem;">`
    : `<div style="width: 200px; height: 300px; background: var(--gradient); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; text-align: center; margin-bottom: 1rem;">${book.title}</div>`

  content.innerHTML = `
                <div style="text-align: center;">
                    ${coverContent}
                    <h2>${book.title}</h2>
                    <p><strong>Author:</strong> ${book.author}</p>
                    ${book.first_publish_year ? `<p><strong>First Published:</strong> ${book.first_publish_year}</p>` : ''}
                    ${book.subject && book.subject.length > 0 ? `<p><strong>Subjects:</strong> ${book.subject.slice(0, 3).join(', ')}</p>` : ''}
                </div>
            `

  modal.style.display = 'block'
}

// Authentication functions
function checkAuth() {
  // Simulate checking for stored auth (in a real app, this would check Firebase Auth)
  const storedUser = localStorage.getItem('currentUser')
  if (storedUser) {
    currentUser = JSON.parse(storedUser)
    updateAuthUI()
    loadUserData()
  }
}

function showLogin() {
  const modal = document.getElementById('authModal')
  const content = document.getElementById('authContent')

  content.innerHTML = `
                <h3>Login</h3>
                <form id="loginForm" onsubmit="login(event)">
                    <div class="form-group">
                        <label for="loginEmail">Email</label>
                        <input type="email" id="loginEmail" required>
                    </div>
                    <div class="form-group">
                        <label for="loginPassword">Password</label>
                        <input type="password" id="loginPassword" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Login</button>
                    <p style="text-align: center; margin-top: 1rem;">
                        Don't have an account? <a href="#" onclick="showRegister()" style="color: var(--primary);">Sign up</a>
                    </p>
                </form>
            `

  modal.style.display = 'block'
}

function showRegister() {
  const modal = document.getElementById('authModal')
  const content = document.getElementById('authContent')

  content.innerHTML = `
                <h3>Sign Up</h3>
                <form id="registerForm" onsubmit="register(event)">
                    <div class="form-group">
                        <label for="registerName">Name</label>
                        <input type="text" id="registerName" required>
                    </div>
                    <div class="form-group">
                        <label for="registerEmail">Email</label>
                        <input type="email" id="registerEmail" required>
                    </div>
                    <div class="form-group">
                        <label for="registerPassword">Password</label>
                        <input type="password" id="registerPassword" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Sign Up</button>
                    <p style="text-align: center; margin-top: 1rem;">
                        Already have an account? <a href="#" onclick="showLogin()" style="color: var(--primary);">Login</a>
                    </p>
                </form>
            `

  modal.style.display = 'block'
}

function login(event) {
  event.preventDefault()
  const email = document.getElementById('loginEmail').value
  const password = document.getElementById('loginPassword').value

  // Simulate login (in a real app, this would use Firebase Auth)
  currentUser = {
    uid: 'user123',
    email: email,
    name: email.split('@')[0],
  }

  localStorage.setItem('currentUser', JSON.stringify(currentUser))
  updateAuthUI()
  loadUserData()
  closeModal()
  showMessage('Login successful!', 'success')
}

function register(event) {
  event.preventDefault()
  const name = document.getElementById('registerName').value
  const email = document.getElementById('registerEmail').value
  const password = document.getElementById('registerPassword').value

  // Simulate registration (in a real app, this would use Firebase Auth)
  currentUser = {
    uid: 'user123',
    email: email,
    name: name,
  }

  localStorage.setItem('currentUser', JSON.stringify(currentUser))
  updateAuthUI()
  loadUserData()
  closeModal()
  showMessage('Account created successfully!', 'success')
}

function logout() {
  currentUser = null
  localStorage.removeItem('currentUser')
  localStorage.removeItem('userLists')
  localStorage.removeItem('userReviews')
  userLists = { toRead: [], read: [] }
  reviews = []
  updateAuthUI()
  showSection('home')
  showMessage('Logged out successfully!', 'success')
}

function updateAuthUI() {
  const authButtons = document.getElementById('authButtons')
  const userMenu = document.getElementById('userMenu')
  const welcomeUser = document.getElementById('welcomeUser')
  const listsLink = document.getElementById('listsLink')
  const reviewsLink = document.getElementById('reviewsLink')

  if (currentUser) {
    authButtons.style.display = 'none'
    userMenu.style.display = 'flex'
    userMenu.style.alignItems = 'center'
    userMenu.style.gap = '1rem'
    welcomeUser.textContent = `Welcome, ${currentUser.name}!`
    listsLink.style.display = 'block'
    reviewsLink.style.display = 'block'
  } else {
    authButtons.style.display = 'flex'
    userMenu.style.display = 'none'
    listsLink.style.display = 'none'
    reviewsLink.style.display = 'none'
  }

  // Refresh current section if it's lists or search
  if (currentSection === 'search') {
    const resultsEl = document.getElementById('searchResults')
    if (resultsEl.innerHTML && books.length > 0) {
      displayBooks(books, resultsEl)
    }
  } else if (currentSection === 'home') {
    loadFeaturedBooks()
  }
}

// User data management
function loadUserData() {
  if (!currentUser) return

  // Load user lists from localStorage (in a real app, this would be Firebase)
  const storedLists = localStorage.getItem('userLists')
  if (storedLists) {
    userLists = JSON.parse(storedLists)
  }

  // Load user reviews
  const storedReviews = localStorage.getItem('userReviews')
  if (storedReviews) {
    reviews = JSON.parse(storedReviews)
  }
}

function saveUserData() {
  if (!currentUser) return

  localStorage.setItem('userLists', JSON.stringify(userLists))
  localStorage.setItem('userReviews', JSON.stringify(reviews))
}

// List management
function addToList(listType, bookKey) {
  if (!currentUser) {
    showMessage('Please login to add books to your lists', 'error')
    return
  }

  const book = findBook(bookKey)
  if (!book) return

  // Check if book is already in the list
  if (userLists[listType].some((b) => b.key === bookKey)) {
    showMessage('Book is already in your list', 'error')
    return
  }

  userLists[listType].push({
    ...book,
    addedDate: new Date().toISOString(),
  })

  saveUserData()
  showMessage(
    `Added "${book.title}" to your ${listType === 'toRead' ? 'To Read' : 'Read'} list!`,
    'success',
  )

  // Refresh current view
  if (currentSection === 'lists') {
    loadUserLists()
  } else if (currentSection === 'search') {
    const resultsEl = document.getElementById('searchResults')
    if (resultsEl.innerHTML && books.length > 0) {
      displayBooks(books, resultsEl)
    }
  } else if (currentSection === 'home') {
    loadFeaturedBooks()
  }
}

function markAsRead(bookKey) {
  if (!currentUser) return

  const bookIndex = userLists.toRead.findIndex((b) => b.key === bookKey)
  if (bookIndex === -1) return

  const book = userLists.toRead[bookIndex]
  userLists.toRead.splice(bookIndex, 1)
  userLists.read.push({
    ...book,
    readDate: new Date().toISOString(),
  })

  saveUserData()
  showMessage(`Marked "${book.title}" as read!`, 'success')

  // Refresh current view
  if (currentSection === 'lists') {
    loadUserLists()
  } else if (currentSection === 'search' && books.length > 0) {
    const resultsEl = document.getElementById('searchResults')
    displayBooks(books, resultsEl)
  } else if (currentSection === 'home') {
    loadFeaturedBooks()
  }
}

function removeFromList(listType, bookKey) {
  const bookIndex = userLists[listType].findIndex((b) => b.key === bookKey)
  if (bookIndex === -1) return

  const book = userLists[listType][bookIndex]
  userLists[listType].splice(bookIndex, 1)

  saveUserData()
  showMessage(`Removed "${book.title}" from your list`, 'success')
  loadUserLists()
}

function loadUserLists() {
  const toReadContainer = document.getElementById('toReadList')
  const readContainer = document.getElementById('readList')

  // Load To Read list
  if (userLists.toRead.length === 0) {
    toReadContainer.innerHTML =
      '<div class="message">No books in your To Read list yet. Start browsing to add some!</div>'
  } else {
    toReadContainer.innerHTML = ''
    userLists.toRead.forEach((book) => {
      const listItem = createListItem(book, 'toRead')
      toReadContainer.appendChild(listItem)
    })
  }

  // Load Read list
  if (userLists.read.length === 0) {
    readContainer.innerHTML =
      '<div class="message">No books marked as read yet.</div>'
  } else {
    readContainer.innerHTML = ''
    userLists.read.forEach((book) => {
      const listItem = createListItem(book, 'read')
      readContainer.appendChild(listItem)
    })
  }
}

function createListItem(book, listType) {
  const item = document.createElement('div')
  item.className = `list-item ${listType === 'read' ? 'read' : ''}`

  const hasReview = reviews.some(
    (r) => r.bookKey === book.key && r.userId === currentUser.uid,
  )

  let actionButtons = ''
  if (listType === 'toRead') {
    actionButtons = `
                    <button class="btn btn-small btn-primary" onclick="markAsRead('${book.key}')">Mark as Read</button>
                    <button class="btn btn-small btn-outline" onclick="removeFromList('toRead', '${book.key}')">Remove</button>
                `
  } else {
    actionButtons = `
                    <button class="btn btn-small" style="background: var(--success)" onclick="writeReview('${book.key}')">${hasReview ? 'Edit Review' : 'Write Review'}</button>
                    <button class="btn btn-small btn-outline" onclick="removeFromList('read', '${book.key}')">Remove</button>
                `
  }

  item.innerHTML = `
                <div>
                    <div class="book-title">${book.title}</div>
                    <div class="book-author">by ${book.author}</div>
                    ${book.readDate ? `<small class="text-muted">Read on ${new Date(book.readDate).toLocaleDateString()}</small>` : ''}
                    ${book.addedDate ? `<small class="text-muted">Added on ${new Date(book.addedDate).toLocaleDateString()}</small>` : ''}
                </div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    ${actionButtons}
                </div>
            `

  return item
}

// Review management
function writeReview(bookKey) {
  if (!currentUser) {
    showMessage('Please login to write reviews', 'error')
    return
  }

  const book = findBook(bookKey)
  if (!book) return

  // Check if book is in read list
  const isRead = userLists.read.some((b) => b.key === bookKey)
  if (!isRead) {
    showMessage('You can only review books you have marked as read', 'error')
    return
  }

  currentBook = book
  const modal = document.getElementById('reviewModal')
  const content = document.getElementById('reviewContent')

  // Check if user already has a review for this book
  const existingReview = reviews.find(
    (r) => r.bookKey === bookKey && r.userId === currentUser.uid,
  )

  content.innerHTML = `
                <h3>${existingReview ? 'Edit Review' : 'Write a Review'}</h3>
                <p><strong>${book.title}</strong> by ${book.author}</p>
                <form id="reviewForm" onsubmit="submitReview(event)">
                    <div class="form-group">
                        <label for="reviewRating">Rating</label>
                        <select id="reviewRating" required>
                            <option value="">Select rating</option>
                            <option value="1" ${existingReview && existingReview.rating === 1 ? 'selected' : ''}>1 Star</option>
                            <option value="2" ${existingReview && existingReview.rating === 2 ? 'selected' : ''}>2 Stars</option>
                            <option value="3" ${existingReview && existingReview.rating === 3 ? 'selected' : ''}>3 Stars</option>
                            <option value="4" ${existingReview && existingReview.rating === 4 ? 'selected' : ''}>4 Stars</option>
                            <option value="5" ${existingReview && existingReview.rating === 5 ? 'selected' : ''}>5 Stars</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="reviewText">Review</label>
                        <textarea id="reviewText" placeholder="Write your review..." required>${existingReview ? existingReview.text : ''}</textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">${existingReview ? 'Update Review' : 'Submit Review'}</button>
                </form>
            `

  modal.style.display = 'block'
}

function submitReview(event) {
  event.preventDefault()

  const rating = parseInt(document.getElementById('reviewRating').value)
  const text = document.getElementById('reviewText').value.trim()

  if (!rating || !text) {
    showMessage('Please fill in all fields', 'error')
    return
  }

  // Check if updating existing review
  const existingReviewIndex = reviews.findIndex(
    (r) => r.bookKey === currentBook.key && r.userId === currentUser.uid,
  )

  const review = {
    id:
      existingReviewIndex >= 0
        ? reviews[existingReviewIndex].id
        : Date.now().toString(),
    bookKey: currentBook.key,
    bookTitle: currentBook.title,
    bookAuthor: currentBook.author,
    userId: currentUser.uid,
    userName: currentUser.name,
    rating: rating,
    text: text,
    date: new Date().toISOString(),
  }

  if (existingReviewIndex >= 0) {
    reviews[existingReviewIndex] = review
    showMessage('Review updated successfully!', 'success')
  } else {
    reviews.push(review)
    showMessage('Review submitted successfully!', 'success')
  }

  saveUserData()
  closeModal()

  // Refresh reviews if on reviews page
  if (currentSection === 'reviews') {
    loadAllReviews()
  }
}

function loadAllReviews() {
  const container = document.getElementById('allReviews')

  if (reviews.length === 0) {
    container.innerHTML =
      '<div class="message">No reviews yet. Start reading and reviewing books!</div>'
    return
  }

  // Sort reviews by date (newest first)
  const sortedReviews = [...reviews].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  )

  container.innerHTML = ''
  sortedReviews.forEach((review) => {
    const reviewItem = createReviewItem(review)
    container.appendChild(reviewItem)
  })
}

function createReviewItem(review) {
  const item = document.createElement('div')
  item.className = 'review-item fade-in'

  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating)

  item.innerHTML = `
                <div class="review-header">
                    <div>
                        <div class="review-author">${review.userName}</div>
                        <div style="font-size: 0.9rem; color: var(--text-muted);">${review.bookTitle} by ${review.bookAuthor}</div>
                    </div>
                    <div>
                        <div class="review-rating">${stars}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">${new Date(review.date).toLocaleDateString()}</div>
                    </div>
                </div>
                <div class="review-text">${review.text}</div>
            `

  return item
}

// Utility functions
function findBook(bookKey) {
  // First check current books array
  let book = books.find((b) => b.key === bookKey)

  // Then check featured books
  if (!book) {
    book = featuredBooks.find((b) => b.key === bookKey)
  }

  // Then check user lists
  if (!book) {
    book =
      userLists.toRead.find((b) => b.key === bookKey) ||
      userLists.read.find((b) => b.key === bookKey)
  }

  return book
}

function showMessage(message, type = 'success') {
  // Remove existing messages
  const existingMessages = document.querySelectorAll('.message.toast')
  existingMessages.forEach((msg) => msg.remove())

  const messageEl = document.createElement('div')
  messageEl.className = `message ${type} toast`
  messageEl.style.position = 'fixed'
  messageEl.style.top = '100px'
  messageEl.style.right = '20px'
  messageEl.style.zIndex = '9999'
  messageEl.style.minWidth = '300px'
  messageEl.textContent = message

  document.body.appendChild(messageEl)

  // Auto-remove after 3 seconds
  setTimeout(() => {
    messageEl.remove()
  }, 3000)
}

function closeModal() {
  const modals = document.querySelectorAll('.modal')
  modals.forEach((modal) => (modal.style.display = 'none'))
}

// Close modal when clicking outside
document.addEventListener('click', function (event) {
  const modals = document.querySelectorAll('.modal')
  modals.forEach((modal) => {
    if (event.target === modal) {
      modal.style.display = 'none'
    }
  })
})

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', init)
