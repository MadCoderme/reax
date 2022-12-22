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

} from '@chakra-ui/react';
import { VscEdit, VscTrash } from "react-icons/vsc"
import CodeEditor from "@monaco-editor/react"
import io from "socket.io-client"


import { SEMI_BACK } from "../../utils/colors";

const socket = io("ws://localhost:3001");

const uid = +new Date()
var inter = null

export default function Editor(params) {

    const [code, setCode] = useState(`
    import React from 'react'

    export default function App () {
        return (
            <div>
                <p>hello</p>
            </div>
        )
    }`);
    const [editor, setEditor] = useState(null)
    const componentEditor = useRef()
    const functionEditor = useRef()
    const packageEditor = useRef()
    const utilsLib = useRef()

    useEffect(() => {
        socket.on('connect', () => {
            //alert('connected to socket io')
        });

        socket.on('code', e => {
            if(e.uid !== uid && e.newCode !== code) {
                setCode(e.newCode)
            }
        })

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('pong');
            //clearInterval(inter)
        };
    }, [])

    const editorOnMount = (e, m) => {
        setEditor(e)
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
            if(ev.uid !== uid) {
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
    }

    const sendUpdates = (e) => {
        var prevCode = ``
        var prevPos = null
        inter = setInterval(() => {
            let currCode = e.getValue()
            let currPosition = e.getPosition()

            if(prevCode !== currCode) {
                socket.emit('code', {
                    newCode: currCode,
                    uid: uid
                })
                prevCode =  currCode.repeat(1)
            } 

            if(prevPos !== currPosition) {
                socket.emit('cursorPos', {
                    newPos: currPosition,
                    uid: uid
                })
                prevPos = currPosition
            } 

        }, 2000);
    }

    return (
        <Box minH="100%">
            <Grid templateColumns='repeat(6, 1fr)' gap={0} height="100%">
                <GridItem colSpan={1} h='100%'>
                    <SidebarContent
                        display={{ base: 'none', md: 'block' }}
                        editor={editor}
                        componentEditor={componentEditor}
                        functionEditor={functionEditor}
                        packageEditor={packageEditor}
                        utilsLib={utilsLib}
                    />
                </GridItem>
                <GridItem colSpan={4} h='100%'>
                    <CodeEditor
                        height="100%"
                        width="100%"
                        defaultLanguage="javascript"
                        value={code}
                        theme="vs-dark"
                        onMount={editorOnMount}
                        onChange={v => setCode(v)}
                    />
                </GridItem>
                <GridItem colSpan={1} h='100%'>
                    <SidebarContent
                        display={{ base: 'none', md: 'block' }}
                    />
                </GridItem>
            </Grid>

            <ComponentEditor ref={componentEditor} />
            <FunctionsEditor ref={functionEditor} />
            <PackageEditor ref={packageEditor} />
            <UtilsLibrary ref={utilsLib} />
           
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

const SidebarContent = ({ onClose, editor, componentEditor, functionEditor, packageEditor, utilsLib, ...rest }) => {

    const insertComponent = (link) => {
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
            text: link.code,
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
            text: 'import ' + link.name + ' from "components/' + link.name + '" \n',
            forceMoveMarkers: true,
        };

        const value = editor.getValue()
        const changes = value.includes('import ' + link.name + ' from "components/' + link.name + '" \n') ? [op] : [op, opi]

        editor.executeEdits('my-source', changes);
    }

    const [dirs, setDirs] = useState({
        'src': ['index.js'],
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

    const Item = ({title, i}) => (
        <AccordionItem borderWidth={0} borderColor={SEMI_BACK} key={i}> 
            <h2>
                <AccordionButton width={'auto'}  _hover={{
                    bg: 'cyan.800',
                    color: 'white',
                }} borderRadius={10} ml={2} padding={2}>
                    <AccordionIcon color={'cyan.400'} />
                    <Box as="span" flex='1' textAlign='left' color={"cyan.300"}>
                        {title}
                    </Box>
                </AccordionButton>
            </h2>
            <AccordionPanel borderWidth={0} pb={4}>
                {dirs[title].map((item) => 
                    <Button textAlign='left' ml={5} mb={2} variant="ghost" _hover={{
                        bg: 'rgba(255,255,255,0.1)'
                    }} key={item}>
                        <Grid templateColumns='repeat(2, 1fr)' gap={2}>
                            <GridItem w='100%'>
                                <Text color="cyan.300">{item}</Text>
                            </GridItem>
                            <GridItem w='100%' >
                                {title === "components" ? <>
                                    <Button colorScheme={'cyan'} size="xs" mr={2} onClick={() => componentEditor?.current?.open(item)}>
                                        Edit
                                    </Button>
                                    <Button size="xs" onClick={() => insertComponent({code: '<Header title={""} />', name: item})}>
                                        Use
                                    </Button>
                                </> : null}
                                {title === "utils" ? <>
                                    <Button colorScheme={'cyan'} size="xs" mr={2} onClick={() => functionEditor?.current?.open(item)}>
                                        Edit
                                    </Button>
                                </> : null}
                            </GridItem>
                        </Grid>
                            
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
                            <Button colorScheme={'cyan'} size="xs" mr={2} onClick={() => packageEditor?.current?.open()}>
                                Edit
                            </Button>
                        </GridItem>
                    </Grid>
            </Button>

            <Button variant="ghost" colorScheme="whiteAlpha" _hover={{ bg: 'whiteAlpha.100' }} mt={5} onClick={() => utilsLib?.current?.open()}>
                Utils Library
            </Button>
      </Box>
    )
}

const ComponentEditor = forwardRef(({ name }, ref) => {
    
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [data, setData] = useState({})
    const [props, setProps] = useState([
        { name: 'title', type: 'text' }
    ])

    useImperativeHandle(ref, () => ({
        open(name) {
            setData({
                name: name,
                code: `const { isOpen, onOpen, onClose } = useDisclosure()
                return (
                    <>
                    <Button onClick={onOpen}>Open Modal</Button>

                    <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose}>
                        <ModalOverlay />
                        <ModalContent>
                        <ModalHeader>Create your account</ModalHeader>
                        <ModalCloseButton />
                        <ModalBody pb={6}>
                            <Lorem count={2} />
                        </ModalBody>

                        <ModalFooter>
                            <Button colorScheme='blue' mr={3}>
                            Save
                            </Button>
                            <Button onClick={onClose}>Cancel</Button>
                        </ModalFooter>
                        </ModalContent>
                    </Modal>
                    </>
                )`
            })

            setProps([])

            
            onOpen()

        }
    }))

    const showProps = () => {
        let txt = ``

        props.forEach(el => {
            if(!el?.name) return
            let type = `""`
            switch (el?.type) {
                case "Number":
                    type = `{0}`
                    break;
                case "Boolean":
                    type = `{true}`
                    break
                case "Others":
                    type = `{}`
                    break
                default:
                    break;
            }
            txt += `${el.name}=${type} ` 
        })

        return txt
    }

    const setPropValue = (val, idx, param) => {
        let prev = [...props]
        prev[idx][param] = val.target.value
        setProps(prev)
    }

    return (
        <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose} size="5xl">
            <ModalOverlay bg='blackAlpha.300' backdropFilter='blur(10px) hue-rotate(90deg)' />
            <ModalContent bg="blackAlpha.500" height="80%">
            <ModalHeader color="cyan.300">{data?.name}</ModalHeader>
            <ModalCloseButton color="#ababab" />
            <ModalBody pb={6} pt={6} height="100%" width="100%" borderRadius={10} overflow="hidden">
                <Tabs height="100%" width="100%" variant='soft-rounded' colorScheme='cyan'>
                    <TabList borderBottomColor="blackAlpha.400">
                        <Tab>Code</Tab>
                        <Tab>Config</Tab>
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
                                    {`<${data?.name} ${props?.length > 0 ? showProps() : null} />`}
                                </Text>
                            </CardBody>
                        </Card>
                            {props?.length > 0 && props?.map((item, idx) => (
                                <Grid templateColumns='repeat(2, 1fr)' gap={5} mt={5} key={item?.name}>
                                        <GridItem>
                                            <label for={item?.name + '-value'} style={{color: '#ababab'}}>{idx + 1}. Prop Value</label>
                                            <Input 
                                                id={item?.name + '-value'} 
                                                placeholder="Value" 
                                                defaultValue={item?.name} 
                                                color="whiteAlpha.600" 
                                                colorScheme="cyan"
                                                mt={2}
                                                onChange={e => setPropValue(e, idx, 'name')} />
                                        </GridItem>
                                       <GridItem>
                                            <label for={item?.name + '-type'} style={{color: '#ababab'}}>Prop Type</label>
                                            <Select 
                                                id={item?.name + '-type'} 
                                                colorScheme="cyan" 
                                                color="whiteAlpha.600" 
                                                mt={2} 
                                                defaultValue={item?.type}
                                                onChange={e => setPropValue(e, idx, 'type')}>
                                                <option style={{background: SEMI_BACK}}>Text</option>
                                                <option style={{background: SEMI_BACK}}>Number</option>
                                                <option style={{background: SEMI_BACK}}>Boolean</option>
                                                <option style={{background: SEMI_BACK}}>Others</option>
                                            </Select>
                                       </GridItem>  
                                    </Grid>
                            ))}
                            
                            <Button 
                                colorScheme="cyan" 
                                variant="outline"
                                alignSelf="flex-end" 
                                mt={10}
                                mb={10}
                                onClick={() => props.length > 0 ? 
                                    setProps(prev => [...prev, {name: '', type: 'Text'}])
                                : setProps([{name: '', type: 'Text'}])}>
                                    Add Prop
                            </Button>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </ModalBody>

            <ModalFooter>
                <Button colorScheme='cyan' mr={3}>
                    Save
                </Button>
                <Button onClick={onClose}>Cancel</Button>
            </ModalFooter>
            </ModalContent>
        </Modal>
    )
})

const FunctionsEditor = forwardRef(({ name }, ref) => {
    
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [data, setData] = useState({})

    useImperativeHandle(ref, () => ({
        open(name) {
            setData({
                name: name,
                code: `
                    export function ${name} (a, b) {
                        return a + b
                    }
                `
            })
            
            onOpen()

        }
    }))


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
                />
            </ModalBody>

            <ModalFooter>
                <Button colorScheme='cyan' mr={3}>
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
    const [data, setData] = useState({})
    const [newType, setNewType] = useState('')

    useImperativeHandle(ref, () => ({
        open(name) {
            setData(JSON.parse(`{
                "name": "reax",
                "version": "0.1.0",
                "private": true,
                "dependencies": {
                  "@chakra-ui/react": "^2.4.4",
                  "@emotion/react": "^11.10.5",
                  "@emotion/styled": "^11.10.5",
                  "@fontsource/chivo-mono": "^4.5.0",
                  "@monaco-editor/react": "^4.4.6",
                  "@testing-library/jest-dom": "^5.16.5",
                  "@testing-library/react": "^13.4.0",
                  "@testing-library/user-event": "^13.5.0",
                  "framer-motion": "^7.10.2",
                  "react": "^18.2.0",
                  "react-dom": "^18.2.0",
                  "react-icons": "^4.7.1",
                  "react-scripts": "5.0.1",
                  "web-vitals": "^2.1.4"
                },
                "scripts": {
                  "start": "react-scripts start",
                  "build": "react-scripts build",
                  "test": "react-scripts test",
                  "eject": "react-scripts eject"
                },
                "eslintConfig": {
                  "extends": [
                    "react-app",
                    "react-app/jest"
                  ]
                },
                "browserslist": {
                  "production": [
                    ">0.2%",
                    "not dead",
                    "not op_mini all"
                  ],
                  "development": [
                    "last 1 chrome version",
                    "last 1 firefox version",
                    "last 1 safari version"
                  ]
                }
              }
              `))
            
            onOpen()

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
                <Button colorScheme='cyan' mr={3}>
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