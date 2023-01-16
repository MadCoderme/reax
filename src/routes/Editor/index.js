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
import { VscCircleFilled, VscEdit, VscNewFile, VscTrash } from "react-icons/vsc"
import CodeEditor from "@monaco-editor/react"
import io from "socket.io-client"
import { Octokit, App } from "octokit"
import { Hook, Console, Decode, Unhook } from 'console-feed'

import { SEMI_BACK } from "../../utils/colors";
import ComponentEditor from './components/ComponentEditor'
import Menu from "./components/Menu";
import { useSearchParams } from "react-router-dom";
import LibraryManager from "./components/LibraryManager";
import ConfigureAppearance from "./components/ConfigureAppearance";

const socket = io("ws://localhost:3001");
var inter = null
const uid = +new Date()

export default function Editor(params) {

    const [code, setCode] = useState(``);
    const [editor, setEditor] = useState(null)
    const [isUnsaved, setUnsaved] = useState(false)
    const [searchParams, setSearchParams] = useSearchParams()
    const [isLeftVisible, setLeftVisible] = useState(true)
    const [isRightVisible, setRightVisible] = useState(true)
    const [isPreviewVisible, setPreviewVisible] = useState(true)
    const componentEditor = useRef()
    const functionEditor = useRef()
    const packageEditor = useRef()
    const utilsLib = useRef()
    const libManager = useRef()
    const appearanceConfigure = useRef()
    const sidebarRight = useRef()
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

    useEffect(() => {
        if(isPreviewVisible) 
            dragElement(document.getElementById('resizer-block'))
    }, [isPreviewVisible])

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
            setUnsaved(true)
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
                        setUnsaved(false)
                        fetch(`http://localhost:5000/addFileForGithub?app=${app}&path=${app}/${file}`)
                            .then(response => response.json())
                            .then(responseJson => {
                                //console.log(responseJson)
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

    function handleViewToggle(type) {
        switch (type) {
            case 'left':
                setLeftVisible(prev => !prev)
                break;
            case 'right':
                setRightVisible(prev => !prev)
                break;
            case 'preview':
                document.getElementById('editor-panel').style.height = isPreviewVisible ? '100%' : '80%'
                setPreviewVisible(prev => !prev)
                break;
            case 'console':
                sidebarRight?.current?.toggleConsole()
                break;
            case 'git':
                sidebarRight?.current?.toggleGithub()
                break;
            default:
                break;
        }
    }

    function dragElement(elmnt) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        elmnt.onmousedown = (e) => {
          e = e || window.event;
          e.preventDefault();
          // get the mouse cursor position at startup:
          pos3 = e.clientX;
          pos4 = e.clientY;
          document.onmouseup = closeDragElement;
          // call a function whenever the cursor moves:
          document.onmousemove = elementDrag;
        }
      
        function elementDrag(e) {
          e = e || window.event;
          e.preventDefault();
          pos2 = pos4 - e.clientY;
          pos3 = e.clientX;
          pos4 = e.clientY;
          document.getElementById('editor-panel').style.height = pos4 + 'px'
          document.getElementById('preview-panel').style.height = (window.innerHeight - pos4) + 'px'
        }
      
        function closeDragElement() {
          /* stop moving when mouse button is released:*/
          document.onmouseup = null;
          document.onmousemove = null;
        }
    }

    return (
        <Box minH="100%">
            <Menu editor={editor} app={searchParams.get('app')} onToggleView={handleViewToggle} />
            <Grid templateColumns='repeat(6, 1fr)' gap={0} height="95%">
                {isLeftVisible ? 
                <GridItem colSpan={1} h='100%'>
                    <SidebarContent
                        display={{ base: 'none', md: 'block' }}
                        editor={editor}
                        componentEditor={componentEditor}
                        functionEditor={functionEditor}
                        packageEditor={packageEditor}
                        utilsLib={utilsLib}
                        libManager={libManager}
                        appearanceConfigure={appearanceConfigure}
                    /> 
                </GridItem>: null}
                <GridItem colSpan={!isLeftVisible && !isRightVisible ? 6 :
                    !isLeftVisible || !isRightVisible ? 5 : 4} h='100%' bg="blackAlpha.500">

                    <Box  background="#2b2d2f" pl={5} pr={5} alignItems="center" >
                        <Text color="whiteAlpha.500" fontSize={14} display="flex" flexDirection="row">
                            {searchParams.get('file')} 
                            {isUnsaved ? <VscCircleFilled display="inline-block" style={{marginTop: 5, marginLeft: 5}} /> : null}
                        </Text>
                    </Box>
                    <div style={{height: '97%'}}>
                        <div id="editor-panel" style={{ height: '80%' }}>
                            <CodeEditor
                                height="100%"
                                width="100%"
                                defaultLanguage="javascript"
                                defaultValue={code}
                                theme="vs-dark"
                                onMount={editorOnMount}
                                onChange={v => {
                                    setCode(v)
                                }}
                            />
                        </div>
                        {isPreviewVisible ? <Box id="preview-panel" height="20%" width="100%" bg="white">
                            <div style={{
                                width: '100%',
                                background: '#2b2d2f',
                                cursor: 'row-resize'
                            }} id="resizer-block">
                                <Text color="whiteAlpha.500" fontSize={14} ml={5}>Preview</Text>
                            </div>
                            <iframe id="preview-iframe" src={"http://localhost:3000/apps/" + searchParams.get('app')} loading="lazy" />
                        </Box> : null}
                    </div>
                </GridItem>
                <GridItem colSpan={1} h='100%'>
                    <SidebarContentRight
                        ref={sidebarRight}
                        display={{ base: 'none', md: 'block' }}
                    />
                </GridItem>
            </Grid>

            <ComponentEditor ref={componentEditor} />
            <FunctionsEditor ref={functionEditor} />
            <PackageEditor ref={packageEditor} />
            <UtilsLibrary ref={utilsLib} />
            <LibraryManager ref={libManager} />
            <ConfigureAppearance ref={appearanceConfigure} />
           
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

const SidebarContent = ({ onClose, editor, componentEditor, functionEditor, packageEditor, utilsLib, libManager, appearanceConfigure }) => {

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
                fetch(`http://localhost:5000/readFolder?path=${id}/src/components`)
                .then(response => response.json())
                .then(responseJson => {
                    prev.components = responseJson.filter(el => !el.endsWith('.json'))
                    fetch(`http://localhost:5000/readFolder?path=${id}/src/utils`)
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

        fetch(`http://localhost:5000/readFile?path=${id}/src/components/config_${item.substring(0, item.lastIndexOf('.'))}.json`)
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
                    text: 'import ' + item.substring(0, item.lastIndexOf('.')) + ' from "./components/' + item + '" \n',
                    forceMoveMarkers: true,
                };

                const value = editor.getValue()
                const changes = value.includes('import ' + item.substring(0, item.lastIndexOf('.')) + ' from "./components/' + item + '" \n') ? [op] : [op, opi]

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
        h="full">
            <Text color={'#f2f2f2'} ml={5} pt={10}>Workspace</Text>

            <Accordion defaultIndex={[0]} borderWidth={0} allowMultiple>
                
                {Object.keys(dirs).map((item, index) => <Item title={item} i={index} key={index} />)}

            </Accordion>

            <Button textAlign='left' ml={5} mb={2} variant="ghost" _hover={{
                        bg: 'whiteAlpha.100'
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
                <Text color="white" fontWeight="normal">Utils Library</Text>
            </Button>

            <Button variant="ghost" colorScheme="whiteAlpha" _hover={{ bg: 'whiteAlpha.100' }} mt={5} onClick={() => libManager?.current?.open(searchParams.get('app'))}>
                <Text color="white" fontWeight="normal">Library Manager</Text>
            </Button>

            <Button variant="ghost" colorScheme="whiteAlpha" _hover={{ bg: 'whiteAlpha.100' }} mt={5} onClick={() => appearanceConfigure?.current?.open(searchParams.get('app'))}>
                <Text color="white" fontWeight="normal">Configure Appearance</Text>
            </Button>

            <NewFileModal ref={newModal} />
      </Box>
    )
}


const token = `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`
const octokit = new Octokit({ auth: token })

const SidebarContentRight = forwardRef(({ onClose, editor, ...rest }, ref) => {

    const [searchParams, setSearchParams] = useSearchParams()
    const toast = useToast()
    const [login, setLogin] = useState(null)
    const [enableConsole, setEnableConsole] = useState(true)
    const [enableGit, setEnableGit] = useState(true)
    const [projectInfo, setProjectInfo] = useState({})
    const [logs, setLogs] = useState([])
    const [repos, setRepos] = useState([])

    useImperativeHandle(ref, () => ({
        toggleConsole() {
            setEnableConsole(prev => !prev)
        },
        toggleGithub() {
            setEnableGit(prev => !prev)
        }
    }))
    
    useEffect(() => {
        getProjectInfo()
    }, [])

    useEffect(() => {
        const iframe = document.getElementById('preview-iframe').contentWindow
        iframe.addEventListener('error', (message) => {
            iframe.console.error(message.error.stack)
        })

        const hookedConsole = Hook(
            iframe.console,
            (log) => {
                if(!log.data[0].toString().startsWith('No routes matched location "/apps/')) {
                    setLogs((currLogs) => [...currLogs, log])
                }
            },
            false
        )
        return () => Unhook(hookedConsole)
    }, [])

    const getProjectInfo = async() => {
        const {
            data: { login },
        } = await octokit.rest.users.getAuthenticated();

        setLogin(login)

        const id = searchParams.get('app')
        fetch(`http://localhost:5000/readFile?path=${id}/git.json`)
            .then(response => response.text())
            .then(async(responseText) => {
                const code = JSON.parse(responseText)
                setProjectInfo(code)
                if(!code?.repo) {
                    getRepos()
                } else {
                    if(code?.treeHash) {
                        const tree = await octokit.rest.git.getTree({
                            owner: login,
                            repo: code?.repo,
                            tree_sha: code?.treeHash
                        })
                        console.log(tree)
                    } else {
                        try {
                            const commits = await octokit.rest.repos.listCommits({
                                owner: login,
                                repo: code?.repo,
                            })
                            const commitSHA = commits.data[0].sha
                            let prev = {...code}
                            prev.commitSHA = commitSHA
                            setProjectInfo(prev)
                            if(!code?.isSetup) {
                                fetch(`http://localhost:5000/addDirForGithub?app=${id}`)
                                    .then(response => response.json())
                                    .then(async(responseJson) => {
                                        //nothing
                                    })
                            }
                        } catch (e) {
                            console.log(e)
                            
                        }
                    }
                    
                }
            })
    }


    // const handleAuth = (event) => {
    //     console.log(event)
    //     if (event.key === 'Enter') {
    //         const q = event.target.value
    //         let o = new Octokit({ auth: q })
    //         setOctoKit(o)
    //         setConnected(true)
    //         getRepos(o)
    //     }
    // }

    const getRepos = async() => {
        const { data } = await octokit.rest.repos.listForUser({username: login})
        setRepos(data)
    }

    const handleConnection = async(repository) => {
        let prev = {...projectInfo}
        prev.repo = repository.name 

        fetch(`http://localhost:5000/writeFile?path=${searchParams.get('app')}/git.json&content=${JSON.stringify(prev, null, '\t')}`)
            .then(response => response.json())
            .then(responseJson => {
                setProjectInfo(prev)
            })
    }

    const handleCommit = () => {
        fetch(`http://localhost:5000/readFiles?files=${JSON.stringify(projectInfo?.treeFiles.filter(el => !el.endsWith('/git.json')), null, '\t')}&root=${'src/apps/' + searchParams.get('app') + '/'}`)
            .then(response => response.json())
            .then(async(responseJson) => {
                const {
                    data: { sha: currentTreeSHA },
                } = await octokit.rest.git.createTree({
                    owner: login,
                    repo: projectInfo?.repo,
                    tree: responseJson,
                    base_tree: projectInfo?.commitSHA,
                    parents: [projectInfo?.commitSHA]
                })
                
                const {
                    data: { sha: newCommitSHA },
                } = await octokit.rest.git.createCommit({
                    owner: login,
                    repo: projectInfo?.repo,
                    tree: currentTreeSHA,
                    message: `Update from Reax`,
                    parents: [projectInfo?.commitSHA],
                })

                let prev = {...projectInfo}
                prev.newCommitSHA = newCommitSHA

                fetch(`http://localhost:5000/writeFile?path=${searchParams.get('app')}/git.json&content=${JSON.stringify(prev, null, '\t')}`)
                .then(response => response.json())
                .then(responseJson => {
                    setProjectInfo(prev)
                    toast({
                        title: 'Successfully Created New Commit',
                        status: 'success',
                        duration: 2000,
                        isClosable: true,
                    })
                })

            })
    }

    const updateAppearance = () => {
        return new Promise((resolve, reject) => {
            const id = searchParams.get('app')
            fetch(`http://localhost:5000/createPublicFolder?app=${id}`)
                .then(response => response.json())
                .then((responseJson) => {
                    if(responseJson.res === 'success') {
                        fetch(`http://localhost:5000/glob?path=${id}/public`)
                        .then(response => response.json())
                        .then((responseJson) => {
                            const paths = [...responseJson, 'src/apps/' + id + '/appearance.json']
                            fetch(`http://localhost:5000/readFiles?files=${JSON.stringify(paths)}&root=${'src/apps/' + searchParams.get('app') + '/'}`)
                            .then(response => response.json())
                            .then(async(responseJson) => {
                                let iconFile = responseJson.find(el => el.path.includes('public/icon.'))
                                if(iconFile) {
                                    const blobData = await octokit.rest.git.createBlob({
                                        owner: login,
                                        repo: projectInfo?.repo,
                                        content: iconFile.content,
                                        encoding: 'base64',
                                    })
                                    delete responseJson[responseJson.indexOf(iconFile)].content
                                    responseJson[responseJson.indexOf(iconFile)].sha = blobData.data.sha
                                    responseJson[responseJson.indexOf(iconFile)].type = 'blob'
                                }
                                
                                console.log(responseJson)
                                const {
                                    data: { sha: currentTreeSHA },
                                } = await octokit.rest.git.createTree({
                                    owner: login,
                                    repo: projectInfo?.repo,
                                    tree: responseJson,
                                    base_tree: projectInfo?.commitSHA,
                                    parents: [projectInfo?.commitSHA]
                                })
                                
                                const {
                                    data: { sha: newCommitSHA },
                                } = await octokit.rest.git.createCommit({
                                    owner: login,
                                    repo: projectInfo?.repo,
                                    tree: currentTreeSHA,
                                    message: `Update Public Folder`,
                                    parents: [projectInfo?.commitSHA],
                                })

                                await octokit.rest.git.updateRef({
                                    owner: login,
                                    repo: projectInfo?.repo,
                                    sha: newCommitSHA,
                                    ref: "heads/main", 
                                    force: true
                                })

                                let prev = {...projectInfo}
                                prev.treeFiles = []
                                prev.commitSHA = newCommitSHA
                                prev.newCommitSHA = ""

                                fetch(`http://localhost:5000/writeFile?path=${searchParams.get('app')}/git.json&content=${JSON.stringify(prev, null, '\t')}`)
                                .then(response => response.json())
                                .then(responseJson => {
                                    setProjectInfo(prev)
                                    toast({
                                        title: 'Successfully Pushed Public Folder',
                                        status: 'success',
                                        duration: 2000,
                                        isClosable: true,
                                    })
    
                                    let iconExists = paths.find(el => el.includes('public/icon.'))
                                    if(iconExists) {
                                        octokit.rest.repos.getContent({
                                            owner: login,
                                            repo: projectInfo?.repo,
                                            path: iconExists.replace('src/apps/' + id + '/', '')
                                        })
                                        .then(data => {
                                            fetch(`http://localhost:5000/cleanPublicFolder?app=${id}&icon=${data.data.download_url}`)
                                            .then(response => response.json())
                                            .then((responseJson) => {
                                                resolve()
                                            })
                                        })
                                    } else {
                                        fetch(`http://localhost:5000/cleanPublicFolder?app=${id}`)
                                        .then(response => response.json())
                                        .then((responseJson) => {
                                            resolve()
                                        })
                                    }
                                })
                            })
                        })
                    }
                })
        })
    }

    const handlePush = async() => {
        pushLatestCommit()
            .then(() => {
                octokit.rest.repos.getContent({
                    owner: login,
                    repo: projectInfo?.repo,
                    path: 'appearance.json'
                }).then(res => {
                    let remoteAppearance = atob(res.data.content)
                    fetch(`http://localhost:5000/readFile?path=${searchParams.get('app')}/appearance.json`)
                    .then(response => response.text())
                    .then((responseText) => {
                        if(remoteAppearance !== responseText) {
                            updateAppearance()
                        } 
                    })
                })
                .catch(e => {
                    if(e.status === 404) {
                        updateAppearance()
                    }
                })
            })
    }

    const pushLatestCommit = () => {
        return new Promise(async(resolve) => {
            await octokit.rest.git.updateRef({
                owner: login,
                repo: projectInfo?.repo,
                sha: projectInfo?.newCommitSHA,
                ref: "heads/main",
            })
    
            let prev = {...projectInfo}
            prev.treeFiles = []
            prev.commitSHA = projectInfo?.newCommitSHA
            prev.newCommitSHA = ""
    
            fetch(`http://localhost:5000/writeFile?path=${searchParams.get('app')}/git.json&content=${JSON.stringify(prev, null, '\t')}`)
                .then(response => response.json())
                .then(responseJson => {
                    setProjectInfo(prev)
                    toast({
                        title: 'Successfully Pushed',
                        status: 'success',
                        duration: 2000,
                        isClosable: true,
                    })
                    resolve()
                })
        })
    }

    return (
      <Box
        bg={SEMI_BACK}
        borderRight="1px"
        w="full"
        h="full"
        {...rest}>
            {enableGit ? 
            <>
            <Text color={'#f2f2f2'} ml={5} pt={10} mb={2}>Github</Text>
            <Box height="30vh" overflow="auto" ml={2}>
                {projectInfo?.repo ? 
                <>
                    <Box ml={2}>
                        {projectInfo?.treeFiles.length > 0 ? <Button variant="outline" colorScheme="cyan" size="sm" mr={2} mb={2} p={2}
                            _hover={{ bg: 'whiteAlpha.50' }} _active={{ bg: 'whiteAlpha.100' }}
                            onClick={handleCommit}>
                            Commit
                        </Button> : null}
                        {projectInfo?.newCommitSHA ? <Button variant="outline" colorScheme="cyan" size="sm" mb={2} p={2}
                            _hover={{ bg: 'whiteAlpha.50' }} _active={{ bg: 'whiteAlpha.100' }} onClick={handlePush}>
                            Push
                        </Button> : null}
                        {projectInfo?.treeFiles.length === 0 && projectInfo?.newCommitSHA === "" ? 
                            <Text color="whiteAlpha.500" fontSize="sm">All wrapped up</Text>
                        : null}
                    </Box>
                    {projectInfo?.treeFiles.map((i) => i !== 'src/apps/' + searchParams.get('app') + '/git.json' && (
                        <Text fontSize="smaller" mb={1} ml={2} color="whiteAlpha.500">
                            {i.replace('src/apps/' + searchParams.get('app') + '/', '')}
                        </Text>
                    ))}
                </>
                : repos.map((i, v) => (
                    <Button variant="ghost" display="block" _hover={{ bg: 'whiteAlpha.100' }} _active={{ bg: 'whiteAlpha.100' }}
                        onClick={() => handleConnection(i)} key={v}>  
                        <Text fontSize="sm" color="whiteAlpha.500">{i.name}</Text>
                    </Button>
                ))}
            </Box>
            </> : <Box height="1"></Box>}
            

            <Text color={'#f2f2f2'} ml={5} mt={5} mb={2} pt={10}>Debug</Text>
            {enableConsole ? <Box height="35vh" overflow="auto">
                <Console logs={logs} variant="dark" />
            </Box> : null}

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
})

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
                            fetch(`http://localhost:5000/writeFile?path=${searchParams.get('app')}/src/utils/index.js&content=${content}&type=append`)
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
            fetch(`http://localhost:5000/readFile?path=${id}/src/utils/${name}`)
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
        fetch(`http://localhost:5000/writeFile?path=${app}/src/utils/${data?.name}&content=${encodeURIComponent(data?.code)}`)
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
        fetch(`http://localhost:5000/writeFile?path=${app}/package.json&content=${encodeURIComponent(JSON.stringify(data, null, '\t'))}`)
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