import { initializeApp } from 'firebase/app'
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
    apiKey: "AIzaSyBIwgxSzaYsndzFCsbCqqh2PcOfEXzzYf4",
    authDomain: "reax-app.firebaseapp.com",
    projectId: "reax-app",
    storageBucket: "reax-app.appspot.com",
    messagingSenderId: "174139287845",
    appId: "1:174139287845:web:524e87062724492e8e52cc",
    measurementId: "G-PZ4GZ854TD"
};
  
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore()

export {
    app, auth, db
}