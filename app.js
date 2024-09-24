import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";

// Firebase конфигурация
const firebaseConfig = {
  apiKey: "AIzaSyCW4FLiBL59useJxL2P9zXu_pQkeMfieW8",
  authDomain: "editable-db-site.firebaseapp.com",
  projectId: "editable-db-site",
  storageBucket: "editable-db-site.appspot.com",
  messagingSenderId: "508766975047",
  appId: "1:508766975047:web:bf6dc400c95ed25ca06d62",
  measurementId: "G-V9XLXKEHC7"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Элементы DOM
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const notification = document.getElementById('notification');

// Функция для добавления данных в Firestore
async function addData(name, value) {
    try {
        const docRef = await addDoc(collection(db, "data"), {
            name: name,
            value: value
        });
        console.log("Document written with ID: ", docRef.id);
        showNotification("Данные успешно добавлены!");
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}

// Функция для загрузки данных из Firestore
async function loadData() {
    const querySnapshot = await getDocs(collection(db, "data"));
    const dataList = document.getElementById('data-list');
    dataList.innerHTML = ''; // Очищаем текущий список
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const newItem = document.createElement('li');
        newItem.textContent = `${data.name}: ${data.value}`;
        dataList.appendChild(newItem);
    });
}

// Функция для отображения уведомлений
function showNotification(message) {
    notification.textContent = message;
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Обработка события отправки формы
document.getElementById('data-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const value = document.getElementById('value').value;

    if (name && value) {
        // Добавляем данные в Firestore
        addData(name, value).then(() => {
            // Загружаем обновленные данные
            loadData();
        });

        // Очистка полей
        document.getElementById('name').value = '';
        document.getElementById('value').value = '';
    }
});

// Авторизация через Google
loginBtn.addEventListener('click', () => {
    signInWithPopup(auth, provider)
    .then((result) => {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        showNotification(`Вы вошли как ${result.user.displayName}`);
    }).catch((error) => {
        console.error(error);
        showNotification("Ошибка при входе");
    });
});

// Выход из системы
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        showNotification("Вы успешно вышли");
    }).catch((error) => {
        console.error(error);
        showNotification("Ошибка при выходе");
    });
});

// Загрузка данных при загрузке страницы
loadData();
