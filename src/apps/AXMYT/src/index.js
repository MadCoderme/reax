import A from "./components/A.js" 
import React, { useState } from 'react'

export default function App() { 
    const [txt, setTxt] = useState('') 
     
    return (
        <> 
            <A label="dffsfsf"  />
            <button onClick={() => {
                console.error('hello') 
            }}>
                Hello, Click me!
            </button> 
        </>
    )
}