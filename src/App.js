import React, { useEffect, useState } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import '@fontsource/chivo-mono/300.css'
import './App.css';
import theme from './utils/theme'
import Editor from './routes/Editor';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

function App () {

    const [modules, setModules] = useState(['AXMYT'])

    useEffect(() => {
        modules.forEach(el => {
            if(typeof el !== 'string') return
            import('./apps/'+el+'/src')
                .then(module => {
                    let prev = [...modules]
                    prev[modules.indexOf(el)] = { module: module.default, name: el }
                    setModules(prev)
                })
        })
    }, [])

    return  (
        <BrowserRouter>
            <Routes>
                <Route path="/editor" element={<ChakraProvider theme={theme}><Editor /></ChakraProvider>} />
                <Route path="/apps">
                    {modules.map((i) => {
                        if(typeof i === 'string') return
                        const Comp = i.module
                        return <Route path={i.name} key={i.name} element={<Comp />} />
                    })}
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default App;
