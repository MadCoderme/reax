import A from "../components/A.js" 
import React from 'react'
import { test } from '../utils'

export default function App() {
    const [txt, setTxt] = React.useState('')
    
    return (
        <>
            <A label="okay"  />
            <input placeholder="Type" onChange={e => setTxt(e.target.value)} />
            <p>Text: {test()} {txt}</p>
        </>
    )
}