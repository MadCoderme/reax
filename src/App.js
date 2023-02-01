import React, { useEffect, useState } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import '@fontsource/chivo-mono/300.css'
import './App.css';
import theme from './utils/theme'
import Editor from './routes/Editor';
import Dashboard from './routes/Dashboard';
import Auth from './routes/Auth';
import Home from './routes/Home';

function App () {

    const [modules, setModules] = useState(['AXMYT'])

    useEffect(() => {
        fetch(`http://localhost:5000/readFolder?includeFolders=true&path=`)
            .then(response => response.json())
            .then(responseJson => {
                setModules(responseJson)
            })
    }, [])

    useEffect(() => {
        modules.forEach(el => {
            if(typeof el !== 'string') return
            import('./apps/'+el+'/src/index.js')
                .then(module => {
                    let prev = [...modules]
                    prev[modules.indexOf(el)] = { module: module.default, name: el }
                    setModules(prev)
                })
                .catch(e => console.error('Error', e))
        })
    }, [modules])

    const addModule = (id) => {
        let prev = [...modules]
        prev.push(id)
        setModules(prev)
    }

    return  (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<ChakraProvider theme={theme}><Home /></ChakraProvider>} />
                <Route path="/editor" element={<ChakraProvider theme={theme}><Editor /></ChakraProvider>} />
                <Route path="/dashboard" 
                    element={<ChakraProvider theme={theme}>
                        <Dashboard onNewProject={addModule} />
                    </ChakraProvider>} />
                <Route path="/auth" element={<ChakraProvider theme={theme}><Auth /></ChakraProvider>} />
                <Route path="/apps">
                    {modules.map((i) => {
                        if(typeof i === 'string') return
                        const Comp = i.module
                        return <Route path={i.name} key={i.name} element={<AppWrapper title={i.name}><Comp /></AppWrapper>} />
                    })}
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

function AppWrapper ({ children, title }) {
    useEffect(() => {
        document.title = title
    }, [])

    return children
}

export default App;
