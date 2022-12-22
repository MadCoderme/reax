import { ChakraProvider } from '@chakra-ui/react';
import '@fontsource/chivo-mono/300.css'
import './App.css';
import theme from './utils/theme'
import Editor from './routes/Editor';

function App () {
    return  (
        <ChakraProvider theme={theme}>
            <Editor />
        </ChakraProvider>
    )
}

export default App;
