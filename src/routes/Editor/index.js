import React,  { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from "react"
import {
  Box,
  Flex,
  AccordionIcon,
  Link,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  Text,
  useDisclosure,
  Grid,
  GridItem,
  Button,
  Modal,
  ModalBody,
  ModalOverlay,
  ModalContent,
  ModalFooter,
  ModalCloseButton,
  ModalHeader,
  Tab,
  Tabs,
  TabPanel,
  TabPanels,
  TabList,
  Container,
  Input,
  Select,
  Card,
  CardBody,
  useToast,
  Circle,
  HStack,

} from '@chakra-ui/react';
import { VscEdit, VscNewFile, VscTrash } from "react-icons/vsc"
import CodeEditor from "@monaco-editor/react"
import io from "socket.io-client"
import { Octokit, App } from "octokit"

import { SEMI_BACK } from "../../utils/colors";
import ComponentEditor from './components/ComponentEditor'
import Menu from "./components/Menu";
import { useSearchParams } from "react-router-dom";
import LibraryManager from "./components/LibraryManager";

const socket = io("ws://localhost:3001");
var inter = null
const uid = +new Date()

export default function Editor(params) {

    const [code, setCode] = useState(``);
    const [editor, setEditor] = useState(null)
    const [searchParams, setSearchParams] = useSearchParams()
    const componentEditor = useRef()
    const functionEditor = useRef()
    const packageEditor = useRef()
    const utilsLib = useRef()
    const libManager = useRef()
    const toast = useToast()

    useEffect(() => {
        const id = searchParams.get('app')
        let file = searchParams.get('file')
        if(!id) return
        if(!file) {
            searchParams.set('file', 'src/index.js')
            setSearchParams(searchParams)
            file = 'src/index.js'
        }

        fetch(`http://localhost:5000/readFile?path=${id}/${file}`)
            .then(response => response.text())
            .then(responseText => {
                if(editor) {
                    editor.setValue(responseText)
                    return
                }
                setCode(responseText)
            })
    }, [searchParams])

    useEffect(() => {
        socket.on('connect', () => {
            //alert('connected to socket io')
        });     

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('pong');
            //clearInterval(inter)
        };
    }, [])

    const editorOnMount = (e, m) => {
        var shouldSend = true
        setEditor(e)

        e.onDidChangeModelContent(ev => {
            if(!shouldSend) {
                shouldSend = true
                return
            }
            let params = new URLSearchParams(window.location.search);
            let app = params.get('app')
            let file = params.get('file')
            socket.emit('code', {
                change: ev.changes[0].text,
                range: ev.changes[0].range,
                app,
                file,
                uid: uid
            })
        })

        e.onKeyDown(ev => {
            if(ev.browserEvent.ctrlKey  && ev.browserEvent.code === "KeyS") {
                ev.preventDefault()
                const params = new URLSearchParams(window.location.search);
                const app = params.get('app')
                const file = params.get('file')
                const content = encodeURIComponent(e.getValue())
                fetch(`http://localhost:5000/writeFile?path=${app}/${file}&content=${content}`)
                    .then(response => response.json())
                    .then(responseJson => {
                        //console.log(responseJson)
                        toast({
                            title: 'Saved Successfully',
                            status: 'success',
                            duration: 2000,
                            isClosable: true,
                        })
                    })
            }
        })

        m.languages.registerCompletionItemProvider('javascript', {
            provideCompletionItems: function() {
                return {
                    suggestions: [
                        {
                            label: "random_number",
                            insertText: "random_number"
                        },
                        {
                            label: "now",
                            insertText: "now"
                        },
                        {
                            label: "today",
                            insertText: "today"
                        },
                        {
                            label: "autocomplete does work fine between braces",
                            insertText: "autocomplete does work fine between braces"
                        },
                    ]
                };
            }
        })

        sendUpdates(e)
        let cursors = []
        let decorations = []
        const colors = ['team-cursor1', 'team-cursor2', 'team-cursor3', 'team-cursor4', 'team-cursor5'] 

        socket.on('cursorPos', ev => {
            let params = new URLSearchParams(window.location.search);
            let app = params.get('app')
            let file = params.get('file')

            if(ev.uid !== uid && ev.app === app && ev.file === file) {
                const randomCursor = colors[Math.floor(Math.random() * colors.length)];
                let exists = cursors.find(el => el.uid === ev.uid)
                if(exists) {
                    cursors[cursors.indexOf(exists)].pos = ev.newPos
                    decorations = e.deltaDecorations(decorations, [
                        { range: new m.Range(ev.newPos.lineNumber, ev.newPos.column, ev.newPos.lineNumber, ev.newPos.column + 2), 
                            options: { className: exists.color} },
                    ])
                } else {
                    decorations = e.deltaDecorations([], [
                        { range: new m.Range(ev.newPos.lineNumber, ev.newPos.column, ev.newPos.lineNumber, ev.newPos.column + 2), 
                            options: { className: randomCursor} },
                    ])
                    cursors.push({pos: ev.newPos, uid: ev.uid, color: randomCursor})
                }
            }
        })

        socket.on('code', ev => {
            const params = new URLSearchParams(window.location.search);
            const app = params.get('app')
            const file = params.get('file')
            if(ev.uid !== uid && app === ev.app && file === ev.file) {
                const id = { major: 1, minor: 1 };
                const op = {
                    identifier: id,
                    range: ev.range,
                    text: ev.change,
                    forceMoveMarkers: true,
                };

                const changes = [op]
                shouldSend = false
                e.executeEdits('my-source', changes);
            }
        })
    }

    const sendUpdates = (e) => {
        var prevPos = null
        inter = setInterval(() => {
            let currPosition = e.getPosition()
            let params = new URLSearchParams(window.location.search);
            let app = params.get('app')
            let file = params.get('file')
            if(prevPos !== currPosition) {
                socket.emit('cursorPos', {
                    newPos: currPosition,
                    app,
                    file,
                    uid: uid
                })
                prevPos = currPosition
            } 

        }, 2000);
    }

    return (
        <Box minH="100%">
            <Menu  app={searchParams.get('app')} />
            <Grid templateColumns='repeat(6, 1fr)' gap={0} height="95%">
                <GridItem colSpan={1} h='100%'>
                    <SidebarContent
                        display={{ base: 'none', md: 'block' }}
                        editor={editor}
                        componentEditor={componentEditor}
                        functionEditor={functionEditor}
                        packageEditor={packageEditor}
                        utilsLib={utilsLib}
                        libManager={libManager}
                    />
                </GridItem>
                <GridItem colSpan={4} h='100%' bg="blackAlpha.500">
                    <Box height="3%" background="#2b2d2f" pl={5} pr={5} alignItems="center">
                        <Text color="whiteAlpha.500" fontSize={14}>{searchParams.get('file')}</Text>
                    </Box>
                    <div style={{height: '97%'}}>
                        <CodeEditor
                            height="100%"
                            width="100%"
                            defaultLanguage="javascript"
                            defaultValue={code}
                            theme="vs-dark"
                            onMount={editorOnMount}
                            onChange={v => setCode(v)}
                        />
                    </div>
                </GridItem>
                <GridItem colSpan={1} h='100%'>
                    <SidebarContentRight
                        display={{ base: 'none', md: 'block' }}
                    />
                </GridItem>
            </Grid>

            <ComponentEditor ref={componentEditor} />
            <FunctionsEditor ref={functionEditor} />
            <PackageEditor ref={packageEditor} />
            <UtilsLibrary ref={utilsLib} />
            <LibraryManager ref={libManager} />
           
            {/* <Drawer
                autoFocus={false}
                isOpen={isOpen}
                placement="left"
                onClose={onClose}
                returnFocusOnClose={false}
                onOverlayClick={onClose}
                size="full">
                <DrawerContent>
                    <SidebarContent onClose={onClose} />
                </DrawerContent>
            </Drawer> */}
        </Box>
    )
}

const LinkItems = [
    { name: 'Header', code: '<Header title={""} />' },
    { name: 'Footer', code: '<Footer title={""} />' },
    { name: 'Text', code: '<Text title={""} />' }
];

const SidebarContent = ({ onClose, editor, componentEditor, functionEditor, packageEditor, utilsLib, libManager, ...rest }) => {

    const [searchParams, setSearchParams] = useSearchParams()
    const newModal = useRef()
    const [dirs, setDirs] = useState({
        'src': [],
        'components': [
            'Hero',
            'Footer',
            'Header'
        ],
        'utils': [
            'isEven',
            'isOdd'
        ]
    })
    const [mates, setMates] = useState({})

    useEffect(() => {
        const id = searchParams.get('app')
        if(!id) return  

        let prev = {...dirs}

        fetch(`http://localhost:5000/readFolder?path=${id}/src`)
            .then(response => response.json())
            .then(responseJson => {
                prev.src = responseJson
                fetch(`http://localhost:5000/readFolder?path=${id}/components`)
                .then(response => response.json())
                .then(responseJson => {
                    prev.components = responseJson.filter(el => !el.endsWith('.json'))
                    fetch(`http://localhost:5000/readFolder?path=${id}/utils`)
                    .then(response => response.json())
                    .then(responseJson => {
                        prev.utils = responseJson.filter(el => el !== 'index.js')
                        setDirs(prev)
                    })
                })
            })
        
    }, [searchParams])

    useEffect(() => {
        socket.on('fileSwitch', e => {
            let params = new URLSearchParams(window.location.search);
            let app = params.get('app')
            let file = params.get('file')

            if(e.app === app && e.uid !== uid) {
                const paths = e.file.split('/')
                let prev = {...mates}
                if(prev[paths[0]]) {
                    if(prev[paths[0]][paths[1]] && !prev[paths[0]][paths[1]].includes(e.uid)) prev[paths[0]][paths[1]].push(e.uid)
                    else prev[paths[0]][paths[1]] = [e.uid]
                } else{
                    prev[paths[0]] = {}
                    prev[paths[0]][paths[1]] = [e.uid]
                }
                setMates(prev)
            }
        })
    }, [])
    
    const openFile = (name, title) => {
        searchParams.set('file', title + '/' + name)
        setSearchParams(searchParams)
        let params = new URLSearchParams(window.location.search);
        let app = params.get('app')
        let file = params.get('file')
        socket.emit('fileSwitch', {
            uid,
            app,
            file
        })
    }

    const insertComponent = (item) => {
        const id = searchParams.get('app')
        if(!id) return  

        fetch(`http://localhost:5000/readFile?path=${id}/components/config_${item.substring(0, item.lastIndexOf('.'))}.json`)
            .then(response => response.text())
            .then(responseText => {
                let code = JSON.parse(responseText)?.find(el => el?.code != null)?.code

                const selection = editor.getSelection();
                const id = { major: 1, minor: 1 };
                const op = {
                    identifier: id,
                    range: {
                        startLineNumber: selection?.selectionStartLineNumber || 1,
                        startColumn: selection?.selectionStartColumn || 1,
                        endLineNumber: selection?.endLineNumber || 1,
                        endColumn: selection?.endColumn || 1,
                    },
                    text: code,
                    forceMoveMarkers: true,
                };

                const idi = { major: 2, minor: 2 };
                const opi = {
                    identifier: idi,
                    range: {
                        startLineNumber: 1,
                        startColumn: 1,
                        endLineNumber: 1,
                        endColumn: 1,
                    },
                    text: 'import ' + item.substring(0, item.lastIndexOf('.')) + ' from "../components/' + item + '" \n',
                    forceMoveMarkers: true,
                };

                const value = editor.getValue()
                const changes = value.includes('import ' + item.substring(0, item.lastIndexOf('.')) + ' from "../components/' + item + '" \n') ? [op] : [op, opi]

                editor.executeEdits('my-source', changes);
            })
    }

    const Item = ({title, i}) => (
        <AccordionItem borderWidth={0} borderColor={SEMI_BACK} key={i}> 
            <h2>
                <AccordionButton width={'auto'}  _hover={{
                    bg: 'cyan.900',
                    color: 'white',
                }} borderRadius={10} ml={2} padding={2}
                >
                    <AccordionIcon color={'cyan.400'} />
                    <Box as="span" flex='1' textAlign='left' color={"cyan.300"}>
                        {title}
                    </Box>
                    <Button variant="ghost" display="inline-block" 
                            ml={2}  _hover={{bg: 'whiteAlpha.100'}} _active={{bg: 'whiteAlpha.200'}}
                            onClick={() => newModal?.current?.open(title)}>
                        <VscNewFile color={'white'} />
                    </Button>
                </AccordionButton>
            </h2>
            <AccordionPanel borderWidth={0} pb={4}>
                {dirs[title].map((item) => 
                    <Button textAlign='left' ml={5} mb={2} variant="ghost" _hover={{
                        bg: 'whiteAlpha.50'
                    }} _active={{
                        bg: 'whiteAlpha.100'
                    }} 
                    key={item}
                    onClick={() => title === "src" && openFile(item, title)}>
                        <Grid templateColumns='repeat(2, 1fr)' gap={2}>
                            <GridItem w='100%'>
                                <Text color="cyan.300">{item.length > 10 ? item.substring(0, 10) + '...' : item}</Text>
                            </GridItem>
                            <GridItem w='100%' >
                                {title === "components" ? <>
                                    <Button colorScheme={'cyan'} size="xs" mr={2} onClick={() => componentEditor?.current?.open(item)}>
                                        Edit
                                    </Button>
                                    <Button size="xs" onClick={() => insertComponent(item)}>
                                        Use
                                    </Button>
                                </> : null}
                                {title === "utils" ? <>
                                    <Button colorScheme={'cyan'} size="xs" mr={2} onClick={() => functionEditor?.current?.open(item, searchParams.get('app'))}>
                                        Edit
                                    </Button>
                                </> : null}
                            </GridItem>
                        </Grid>
                        <HStack spacing='-10px'>
                            {mates[title] && mates[title][item] && mates[title][item].map(i => {
                                const colors = ['pink', 'yellow', 'red', 'cyan', 'white', 'black']
                                const r = colors[Math.floor(Math.random() * colors.length)]
                                return (
                                    <Circle size="20px" bg={r}>{i.toString().substr(-1)}</Circle>
                                )
                            })}
                        </HStack>
                    </Button>
                )}
            </AccordionPanel>
        </AccordionItem>
    )

    return (
      <Box
        bg={SEMI_BACK}
        borderRight="1px"
        w="full"
        h="full"
        {...rest}>
            <Text color={'#f2f2f2'} ml={5} pt={10}>Workspace</Text>

            <Accordion defaultIndex={[0]} borderWidth={0} allowMultiple>
                
                {Object.keys(dirs).map((item, index) => <Item title={item} i={index} key={index} />)}

            </Accordion>

            <Button textAlign='left' ml={5} mb={2} variant="ghost" _hover={{
                        bg: 'rgba(255,255,255,0.1)'
                }}>
                    <Grid templateColumns='repeat(2, 1fr)' gap={2}>
                        <GridItem w='100%'>
                            <Text color="cyan.300" fontWeight="normal" >Package</Text>
                        </GridItem>
                        <GridItem w='100%' >
                            <Button colorScheme={'cyan'} size="xs" mr={2} onClick={() => packageEditor?.current?.open(searchParams.get('app'))}>
                                Edit
                            </Button>
                        </GridItem>
                    </Grid>
            </Button>

            <Button variant="ghost" colorScheme="whiteAlpha" _hover={{ bg: 'whiteAlpha.100' }} mt={5} onClick={() => utilsLib?.current?.open()}>
                Utils Library
            </Button>

            <Button variant="ghost" colorScheme="whiteAlpha" _hover={{ bg: 'whiteAlpha.100' }} mt={5} onClick={() => libManager?.current?.open(searchParams.get('app'))}>
                Library Manager
            </Button>
            <NewFileModal ref={newModal} />
      </Box>
    )
}


//token for testing: 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
const SidebarContentRight = ({ onClose, editor, ...rest }) => {

    const [isConnected, setConnected] = useState(false)
    const [octokit, setOctoKit] = useState(null)

    useEffect(() => {
        getRepos()
    }, [isConnected])

    const handleAuth = (event) => {
        console.log(event)
        if (event.key === 'Enter') {
            const q = event.target.value
            let o = new Octokit({ auth: q })
            setOctoKit(o)
            setConnected(true)
            getRepos(o)
        }
    }

    const getRepos = async(o) => {
        const {
            data: { login },
        } = await octokit.rest.users.getAuthenticated();
        console.log("Hello, %s", login);

        const { data } = await octokit.rest.repos.listForUser({username: login})
        console.log(data)
    }

    return (
      <Box
        bg={SEMI_BACK}
        borderRight="1px"
        w="full"
        h="full"
        {...rest}>
            <Text color={'#f2f2f2'} ml={5} pt={10}>Github</Text>

            {!isConnected ? <Input 
                variant="outline"
                colorScheme="cyan"
                color="whiteAlpha.800"
                placeholder="Access Token"
                m="2"
                width="90%"
                fontSize="md"
                onKeyDown={handleAuth}
            />
            : 
            <>
            <Text color="whiteAlpha.500">Connect to a Repository</Text>
            <Button onClick={getRepos}>List</Button>
            </>
            }

            {/* <Accordion defaultIndex={[0]} borderWidth={0} allowMultiple>
                
                {Object.keys(dirs).map((item, index) => <Item title={item} i={index} key={index} />)}

            </Accordion>

            <Button textAlign='left' ml={5} mb={2} variant="ghost" _hover={{
                        bg: 'rgba(255,255,255,0.1)'
                }}>
                    <Grid templateColumns='repeat(2, 1fr)' gap={2}>
                        <GridItem w='100%'>
                            <Text color="cyan.300" fontWeight="normal" >Package</Text>
                        </GridItem>
                        <GridItem w='100%' >
                            <Button colorScheme={'cyan'} size="xs" mr={2} onClick={() => packageEditor?.current?.open()}>
                                Edit
                            </Button>
                        </GridItem>
                    </Grid>
            </Button>

            <Button variant="ghost" colorScheme="whiteAlpha" _hover={{ bg: 'whiteAlpha.100' }} mt={5} onClick={() => utilsLib?.current?.open()}>
                Utils Library
            </Button>

            <Button variant="ghost" colorScheme="whiteAlpha" _hover={{ bg: 'whiteAlpha.100' }} mt={5} onClick={() => libManager?.current?.open()}>
                Library Manager
            </Button> */}

      </Box>
    )
}

const NewFileModal = forwardRef((props, ref) => {
    
    const { isOpen, onOpen, onClose } = useDisclosure()
    const toast = useToast()
    const [name, setName] = useState('')
    const [fileType, setType] = useState('src')
    const [searchParams, setSearchParams] = useSearchParams()

    useImperativeHandle(ref, () => ({
        open(type) {
            setType(type)
            onOpen()
        }
    }))

    const handleFileCreation = () => {
        if(name.endsWith('.js') || name.endsWith('.jsx') || name.endsWith('.tsx') || name.endsWith('.ts')) {
            fetch(`http://localhost:5000/newFile?path=${searchParams.get('app')}/${fileType}/${name}`)
                .then(response => response.json())
                .then(responseJson => {
                    if(responseJson.res !== 'success') {
                        toast({
                            title: responseJson.res,
                            status: 'error',
                            duration: 2000,
                            isClosable: true,
                        })
                    } else {

                        if(fileType === 'src') {
                            searchParams.set('file', fileType + '/' + name)
                            setSearchParams(searchParams)
                            onClose()
                        } else if(fileType === 'utils') {
                            const content = `export * from './${name}';`
                            fetch(`http://localhost:5000/writeFile?path=${searchParams.get('app')}/utils/index.js&content=${content}&type=append`)
                            .then(response => response.json())
                            .then(responseJson => {
                                onClose()
                            })
                        } else {
                            onClose()
                        }
                        
                    }
                })
        } else {
            toast({
                title: 'It should be a JS or TS file!',
                status: 'error',
                duration: 2000,
                isClosable: true,
            })
        }
    }

    return (
        <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose}>
            <ModalOverlay bg='blackAlpha.300' backdropFilter='blur(10px) hue-rotate(90deg)' />
            <ModalContent bg="blackAlpha.500">
            <ModalHeader color="cyan.300">New {fileType}/{name}</ModalHeader>
            <ModalCloseButton color="#ababab" />
            <ModalBody pb={6} pt={6} height="100%" width="100%" borderRadius={10} overflow="hidden">
                <Input 
                    placeholder="Name" 
                    variant="filled" 
                    colorScheme="blackAlpha" 
                    color="whiteAlpha.800"
                    bg="whiteAlpha.100" 
                    _hover={{bg: 'whiteAlpha.100'}}
                    onChange={e => setName(e.target.value)} />
            </ModalBody>

            <ModalFooter>
                <Button colorScheme='cyan' mr={3} onClick={handleFileCreation}>
                    Save
                </Button>
                <Button onClick={onClose}>Cancel</Button>
            </ModalFooter>
            </ModalContent>
        </Modal>
    )
})

const FunctionsEditor = forwardRef((prop, ref) => {
    
    const { isOpen, onOpen, onClose } = useDisclosure()
    const toast = useToast()
    const [app, setApp] = useState('')
    const [data, setData] = useState({})

    useImperativeHandle(ref, () => ({
        open(name, id) {
            setApp(id)
            setData({})
            fetch(`http://localhost:5000/readFile?path=${id}/utils/${name}`)
            .then(response => response.text())
            .then(responseText => {
                const code = responseText
                if(!code) {
                    setData({
                        name: name,
                        code: `export function ${name.substring(0, name.lastIndexOf('.'))} () {
                                
}`
                    })
                } else {
                    setData({name, code})
                }
                onOpen()
            })

        }
    }))

    const handleSave = () => {
        fetch(`http://localhost:5000/writeFile?path=${app}/utils/${data?.name}&content=${encodeURIComponent(data?.code)}`)
            .then(response => response.json())
            .then(responseJson => {
                //console.log(responseJson)
                toast({
                    title: 'Saved Successfully',
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                })
                onClose()
            })
    }


    return (
        <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose} size="5xl">
            <ModalOverlay bg='blackAlpha.300' backdropFilter='blur(10px) hue-rotate(90deg)' />
            <ModalContent bg="blackAlpha.500" height="80%">
            <ModalHeader color="cyan.300">{data?.name}</ModalHeader>
            <ModalCloseButton color="#ababab" />
            <ModalBody pb={6} pt={6} height="100%" width="100%" borderRadius={10} overflow="hidden">
                {/* <Tabs height="100%" width="100%" variant='soft-rounded' colorScheme='cyan'>
                    <TabList borderBottomColor="blackAlpha.400">
                        <Tab>Code</Tab>
                        <Tab>Example Usage</Tab>
                    </TabList>

                    <TabPanels height="100%" width="100%">
                        <TabPanel height="100%" width="100%">
                            <CodeEditor
                                height="100%"
                                width="100%"
                                defaultLanguage="javascript"
                                defaultValue={data?.code}
                                theme="vs-dark"
                            />
                        </TabPanel>
                        <TabPanel height="100%" width="100%" overflow="auto">
                            <Card bg="blackAlpha.400" borderRadius={10}>
                                <CardBody>
                                    <Text color="whiteAlpha.600">
                                        {`${data?.name} ${props?.length > 0 ? showProps() : null} />`}
                                    </Text>
                                </CardBody>
                            </Card>
                        </TabPanel>
                    </TabPanels>
                </Tabs> */}
                <CodeEditor
                    height="100%"
                    width="100%"
                    defaultLanguage="javascript"
                    defaultValue={data?.code}
                    theme="vs-dark"
                    onChange={e => {
                        let prev = {...data}
                        prev.code = e
                        setData(prev)
                    }}
                />
            </ModalBody>

            <ModalFooter>
                <Button colorScheme='cyan' mr={3} onClick={handleSave}>
                    Save
                </Button>
                <Button onClick={onClose}>Cancel</Button>
            </ModalFooter>
            </ModalContent>
        </Modal>
    )
})

const PackageEditor = forwardRef((props, ref) => {
    
    const { isOpen, onOpen, onClose } = useDisclosure()
    const toast = useToast()
    const [app, setApp] = useState('')
    const [data, setData] = useState({})
    const [newType, setNewType] = useState('')

    useImperativeHandle(ref, () => ({
        open(id) {
            setData({})
            setNewType('')
            setApp(id)
            fetch(`http://localhost:5000/readFile?path=${id}/package.json`)
            .then(response => response.text())
            .then(responseText => {
                const code = JSON.parse(responseText)
                setData(code)
                onOpen()
            })
        }
    }))

    const setValue = (e, val, type) => {
        if(type === 'value') {
            let prev = {...data}
            prev[val] = e.target.value
            setData(prev)
        } else if(type === 'remove') {
            let prev = {...data}
            delete prev[val]
            setData(prev)
        }
    }

    const handleSave = () => {
        fetch(`http://localhost:5000/writeFile?path=${app}/package.json&content=${encodeURIComponent(JSON.stringify(data))}`)
            .then(response => response.json())
            .then(responseJson => {
                //console.log(responseJson)
                toast({
                    title: 'Saved Successfully',
                    status: 'success',
                    duration: 2000,
                    isClosable: true,
                })
                onClose()
            })
    }

    return (
        <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose} size="5xl">
            <ModalOverlay bg='blackAlpha.300' backdropFilter='blur(10px) hue-rotate(90deg)' />
            <ModalContent bg="blackAlpha.500" height="80%">
            <ModalHeader color="cyan.300">Package</ModalHeader>
            <ModalCloseButton color="#ababab" />
            <ModalBody pb={6} pt={6} height="100%" width="100%" borderRadius={10} overflow="hidden">
                <Tabs height="100%" width="100%" variant='soft-rounded' colorScheme='cyan'>
                    <TabList borderBottomColor="blackAlpha.400">
                        <Tab>Quick Setup</Tab>
                        <Tab>Code</Tab>
                    </TabList>

                    <TabPanels height="100%" width="100%">
                    <TabPanel height="100%" width="100%" overflow="auto">
                            {Object.keys(data)?.map((item, idx) => (
                                <Grid templateColumns='repeat(3, 1fr)' gap={5} mt={5} key={item}>
                                        <GridItem>
                                            <Text color="whiteAlpha.600" mt={5}>
                                                {item} <Button variant="ghost" colorScheme="red" 
                                                    _hover={{bg: 'whiteAlpha.50'}}
                                                    _active={{bg: 'whiteAlpha.100'}}
                                                    onClick={() => setValue(null, item, 'remove')}>
                                                    <VscTrash mt={1} style={{ display: 'inline-block' }} />
                                                </Button>
                                            </Text>
                                        </GridItem>
                                       <GridItem colSpan={2}>
                                            {typeof data[item] === "string" || typeof data[item] === "boolean" ? 
                                            <Input 
                                                id={item + '-value'} 
                                                placeholder="Value" 
                                                defaultValue={data[item]} 
                                                value={data[item]}
                                                color="whiteAlpha.700" 
                                                colorScheme="cyan"
                                                mt={2}
                                                onChange={e => setValue(e, item, 'value')}/>
                                            : typeof data[item] === "object" ?
                                            Object.keys(data[item]).map(i => (
                                                <Grid templateColumns='repeat(2, 1fr)' gap={5} key={item}>
                                                    <GridItem>
                                                        <Input 
                                                            id={item + '-' + i + '-value'} 
                                                            placeholder="Value" 
                                                            defaultValue={i} 
                                                            color="whiteAlpha.700" 
                                                            colorScheme="cyan"
                                                            mt={2} />
                                                    </GridItem>
                                                    <GridItem>
                                                        <Input 
                                                            id={item + '-' + i + '-value'} 
                                                            placeholder="Value" 
                                                            defaultValue={data[item][i]} 
                                                            color="whiteAlpha.700" 
                                                            colorScheme="cyan" 
                                                            mt={2} />
                                                    </GridItem>
                                                </Grid>
                                                ))
                                            : null}
                                       </GridItem>  
                                    </Grid>
                            ))}
                            
                            <Select 
                                colorScheme="cyan" 
                                color="whiteAlpha.600" 
                                mt={10}
                                mb={2}
                                onChange={e => setNewType(e.target.value)}
                                width="36">
                                    <option style={{background: SEMI_BACK}}>name</option>
                                    <option style={{background: SEMI_BACK}}>version</option>
                                    <option style={{background: SEMI_BACK}}>description</option>
                                    <option style={{background: SEMI_BACK}}>keywords</option>
                                    <option style={{background: SEMI_BACK}}>homepage</option>
                                    <option style={{background: SEMI_BACK}}>bugs</option>
                                    <option style={{background: SEMI_BACK}}>license</option>
                            </Select>
                            <Button 
                                colorScheme="cyan" 
                                variant="outline"
                                alignSelf="flex-end" 
                                mb={10}
                                onClick={() => {
                                    let prev = {...data}
                                    prev[newType] = ""
                                    setData(prev)
                                }}
                                disabled={newType.length === 0}
                            >
                                Add Prop
                            </Button>
                        </TabPanel>
                        <TabPanel height="100%" width="100%">
                            <CodeEditor
                                height="100%"
                                width="100%"
                                defaultLanguage="json"
                                value={JSON.stringify(data, null, '\t')}
                                onChange={val => setData(JSON.parse(val))}
                                theme="vs-dark"
                            />
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </ModalBody>

            <ModalFooter>
                <Button colorScheme='cyan' mr={3} onClick={handleSave}>
                    Save
                </Button>
                <Button onClick={onClose}>Cancel</Button>
            </ModalFooter>
            </ModalContent>
        </Modal>
    )
})

const UtilsLibrary = forwardRef((props, ref) => {
    
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [functions, setFunctions] = useState([
        {
            name: 'isOdd',
            code: `export function isOdd(number) {
                    return number % 2
                }
                `,
            description: 'This will take a number as input and return a boolean value if the input number is odd or not'
        },
        {
            name: 'isEven',
            code: `export function isEven(number) {
                    return number % 2
                }
                `,
            description: 'This will take a number as input and return a boolean value if the input number is odd or not'
        }
    ])

    useImperativeHandle(ref, () => ({
        open() {
            
            onOpen()

        }
    }))


    return (
        <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose} size="5xl">
            <ModalOverlay bg='blackAlpha.300' backdropFilter='blur(10px) hue-rotate(90deg)' />
            <ModalContent bg="blackAlpha.500" height="80%">
            <ModalHeader color="cyan.300">Utils Library</ModalHeader>
            <ModalCloseButton color="#ababab" />
            <ModalBody pb={6} pt={6} height="100%" width="100%" borderRadius={10} overflow="hidden">
                <Input 
                    placeholder="Search Functions"
                    variant="flushed"
                    colorScheme="cyan"
                    color="whiteAlpha.700"
                />
                {functions.map((item) => (
                    <Grid templateColumns='repeat(4, 1fr)' gap={5} mt={5} key={item?.name} alignItems="center">
                        <GridItem colSpan={3}>
                            <Text color="whiteAlpha.800">{item?.name}</Text>
                            <Text color="whiteAlpha.400" fontSize="sm">{item?.description}</Text>
                        </GridItem>
                        <GridItem width="100%" colSpan={1} justifyContent="center" alignItems="center">
                            <Button variant="outline" colorScheme="cyan" alignSelf="flex-end">Use</Button>
                        </GridItem>
                    </Grid>
                ))}
            </ModalBody>

            <ModalFooter>
                <Button onClick={onClose}>Cancel</Button>
            </ModalFooter>
            </ModalContent>
        </Modal>
    )
})