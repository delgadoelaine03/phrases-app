import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.6/firebase-app.js'
import { getFirestore, collection, doc, getDoc, setDoc, addDoc, query, where, onSnapshot } from 'https://www.gstatic.com/firebasejs/9.6.6/firebase-firestore.js'
import {
  getAuth,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
} from 'https://www.gstatic.com/firebasejs/9.6.6/firebase-auth.js'

const formAddPhrase = document.querySelector('[data-js="add-phrase-form"]')
const phrasesList = document.querySelector('[data-js="phrases-list"]')
const buttonGoogle = document.querySelector('[data-js="button-google"]')
const buttonLogout = document.querySelector('[data-js="logout"]')
const accountDetailsContainer = document.querySelector('[data-js="account-details"]')

const accountDisplayName = document.createElement('h6')
const accountEmail = document.createElement('p')
const accountPhotoURL = document.createElement('img') 

const firebaseConfig = {
  apiKey: ,
  authDomain: 'movies-quotes-ad3c3.firebaseapp.com',
  projectId: 'movies-quotes-ad3c3',
  storageBucket: 'movies-quotes-ad3c3.appspot.com',
  messagingSenderId: '298795271334',
  appId: '1:298795271334:web:46211b03fc97fbdfa62067',
  measurementId: 'G-EF4ZJ59DR1',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

const db = getFirestore(app)
const collectionPhrases = collection(db, 'phrases')

const closeModalAddPhrase = () => {
  const modalAddPhrase = document.querySelector('[data-modal="add-phrase"]')
    M.Modal.getInstance(modalAddPhrase).close()
}

const AddPhrase = async (event, user) => {
  event.preventDefault()

  try {
    await addDoc (
      collectionPhrases, 
      {
        title: DOMPurify.sanitize(event.target.title.value),
        phrase: DOMPurify.sanitize(event.target.phrase.value),
        userId: DOMPurify.sanitize(user.uid),
      }
    )
    event.target.reset()
    closeModalAddPhrase()
  } catch (error) {
    alert('Problema ao adicionar frase: ', error)
  }
}

const login = async () => {
  const provider = new GoogleAuthProvider()
  try {
    
    signInWithRedirect(auth, provider)
  } catch (error) {
    alert('Erro ao tentar logar: ', error)
  }
}

const logout = async (unsubscribe) => {
  try {
    await signOut(auth)
    unsubscribe()
  } catch (error) {
    alert('Ooops, something went wrong =(: ', error)
  }
}

const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth)
  } catch (error) {
    alert('Houve um problema no redirecionamento: ', error)
  }
}

const renderLinks = ({ userExists }) => {
  const navLinks = [...document.querySelector('[data-js="nav-ul"]').children]

  navLinks.forEach((navLink) => {
    const navLinksShouldBeVisible = navLink.dataset.js.includes(
      userExists ? 'logged-in' : 'logged-out',
    )
  
    if (navLinksShouldBeVisible) {
      navLink.classList.remove('hide')
      return
    }
    navLink.classList.add('hide')
  })
}

const removeLoginMessage = () => {
  const loginMessageExists = document.querySelector('[data-js="login-message"]')
  loginMessageExists?.remove()
}

const handleAnonymousUser = () => {
    const phrasesContainer = document.querySelector('[data-js="phrases-container"]')
    const loginMessage = document.createElement('h5')

    loginMessage.textContent = 'Faça login para visualizar as frases.'
    loginMessage.classList.add('white-text', 'center')
    loginMessage.setAttribute('data-js', 'login-message')
    phrasesContainer.append(loginMessage)

    formAddPhrase.onsubmit = null
    buttonLogout.onclick = null
    buttonGoogle.addEventListener('click', login)
    phrasesList.innerHTML = ''
    accountDetailsContainer.innerHTML = ''
}

const createUserDocument = async (user) => {
  try {
    const userDocRef = doc(db, 'users', user.uid)
    const docSnapshot = await getDoc(userDocRef)
  
    if (!docSnapshot.exists()) {
      await setDoc(userDocRef, {
        name: (user.displayName),
        email: (user.email),
        userId: (user.uid),
      })
    }
    } catch (error) {
    alert('Erro ao tentar cadastrar usuário', error)
  }
}

const renderPhrases = (user) => {
  const queryPhrases = query(collectionPhrases, where('userId', '==', user.uid))

  return onSnapshot(queryPhrases , (snapshot) => {
    const documentFragment = document.createDocumentFragment()

    snapshot.docChanges().forEach((docChange) => {
      const liPhrase = document.createElement('li')
      const liPhraseCard = document.createElement('article')
      liPhraseCard.classList.add(
        'card',
        'card-panel',
        'blue-grey',
        'darken-2',
        'hoverable',
      )
      const liPhraseCardItems = document.createElement('div')
      liPhraseCardItems.classList.add('card-content', 'white-text')
      const titleContainer = document.createElement('span')
      const phraseContainer = document.createElement('p')
      const { title, phrase } = docChange.doc.data()

      phraseContainer.textContent = DOMPurify.sanitize(`"${phrase}"`)
      titleContainer.textContent = DOMPurify.sanitize(title)

      liPhraseCardItems.append(phraseContainer, titleContainer)
      liPhraseCard.append(liPhraseCardItems)

      liPhrase.append(liPhraseCard)
      liPhrase.classList.add('col', 's12')

      documentFragment.append(liPhrase)
    })
    phrasesList.append(documentFragment)
  })
}

const handleSignedUser = async (user) => {
  createUserDocument(user)
  
  buttonGoogle.removeEventListener('click', login)
  formAddPhrase.onsubmit = (event) => AddPhrase(event, user)

  const unsubscribe = renderPhrases(user)

  buttonLogout.onclick = () => logout(unsubscribe)

  accountDisplayName.textContent = DOMPurify.sanitize(user.displayName)
  accountEmail.textContent = DOMPurify.sanitize(user.email)
  accountPhotoURL.src = user.photoURL
  accountPhotoURL.setAttribute('referrerpolicy', 'no-referrer')

  accountDetailsContainer.append(
    accountDisplayName,
    accountPhotoURL,
    accountEmail,
  )
}

const handleAuthStateChanged = async (user) => {
  handleRedirectResult()
  renderLinks({userExists: !!user})
  removeLoginMessage()

  if (!user) {
    handleAnonymousUser()
    return
  }

  handleSignedUser({
      displayName: DOMPurify.sanitize(user.displayName),
      email: DOMPurify.sanitize(user.email),
      uid: DOMPurify.sanitize(user.uid),
      photoURL: DOMPurify.sanitize(user.photoURL)
  })
}

const initModals = () => {
  const modals = document.querySelectorAll('[data-js="modal"]')
  M.Modal.init(modals)
}

onAuthStateChanged(auth, handleAuthStateChanged)

initModals()
