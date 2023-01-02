import React,  { forwardRef, useImperativeHandle, useState, useCallback } from "react"
import {
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

} from '@chakra-ui/react';
import CodeEditor from "@monaco-editor/react"

import { SEMI_BACK } from "../../../utils/colors";
import { useSearchParams } from "react-router-dom";

const ComponentEditor = forwardRef((prop, ref) => {
    
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [searchParams, setSearchParams] = useSearchParams()
    const toast = useToast()
    const [editor, setEditor] = useState(null)
    const [name, setName] = useState('')
    const [code, setCode] = useState('')
    const [props, setProps] = useState([
        { name: 'title', type: 'text' }
    ])

    useImperativeHandle(ref, () => ({
        open(name) {
            setName(name)
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

    const handleMount = (e) => {
        setEditor(e)
        const id = searchParams.get('app')
        const file = 'components/' + name
        const fileConfig = 'components/config_' + name.substring(0, name.lastIndexOf('.')) + '.json'

        fetch(`http://localhost:5000/readFile?path=${id}/${file}`)
            .then(response => response.text())
            .then(responseText => {
                e.setValue(responseText)
            })
        fetch(`http://localhost:5000/readFile?path=${id}/${fileConfig}`)
            .then(response => response.text())
            .then(responseText => {
                setProps(JSON.parse(responseText))
            })
    }

    const handleSave = () => {
        if(editor) {
            const id = searchParams.get('app')
            const file = 'components/' + name
            const fileConfig = 'components/config_' + name.substring(0, name.lastIndexOf('.')) + '.json'
            const content = encodeURIComponent(editor.getValue())

            let configCode = props.find(el => el?.code != null)
            if(configCode) {
                props[props.indexOf(configCode)] = {code: `<${name.substring(0, name.lastIndexOf('.'))} ${props?.length > 0 ? showProps() : ''} />`}
            } else {
                props.push({code: `<${name.substring(0, name.lastIndexOf('.'))} ${props?.length > 0 ? showProps() : ''} />`})
            }
            const configContent = encodeURIComponent(JSON.stringify(props))

            fetch(`http://localhost:5000/writeFile?path=${id}/${file}&content=${content}`)
                .then(response => response.json())
                .then(responseJson => {
                    //console.log(responseJson)
                    setCode('')
                    fetch(`http://localhost:5000/writeFile?path=${id}/${fileConfig}&content=${configContent}`)
                    .then(response => response.json())
                    .then(responseJson => {
                        //console.log(responseJson)
                        setProps([])
                        toast({
                            title: 'Saved Successfully',
                            status: 'success',
                            duration: 2000,
                            isClosable: true,
                        })
                        onClose()
                    }) 
                })    
        }
    }

    const renderPropItem = (item, idx) => (
        <Grid templateColumns='repeat(2, 1fr)' gap={5} mt={5} key={idx}>
                <GridItem>
                    <label style={{color: '#ababab'}}>{idx + 1}. Prop Value</label>
                    <Input 
                        placeholder="Value" 
                        defaultValue={item?.name} 
                        color="whiteAlpha.600" 
                        colorScheme="cyan"
                        mt={2}
                        onChange={e => setPropValue(e, idx, 'name')} />
                </GridItem>
               <GridItem>
                    <label style={{color: '#ababab'}}>Prop Type</label>
                    <Select 
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
    )

    return (
        <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose} size="5xl">
            <ModalOverlay bg='blackAlpha.300' backdropFilter='blur(10px) hue-rotate(90deg)' />
            <ModalContent bg="blackAlpha.500" height="80%">
            <ModalHeader color="cyan.300">{name}</ModalHeader>
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
                                defaultValue={code}
                                theme="vs-dark"
                                onMount={handleMount}
                            />
                        </TabPanel>
                        <TabPanel height="100%" width="100%" overflow="auto">
                        <Card bg="blackAlpha.400" borderRadius={10}>
                            <CardBody>
                                <Text color="whiteAlpha.600">
                                    {`<${name.substring(0, name.lastIndexOf('.'))} ${props?.length > 0 ? showProps() : ''} />`}
                                </Text>
                            </CardBody>
                        </Card>
                            {props?.length > 0 && props.filter(el => el?.name != null)?.map(renderPropItem)}
                            
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
                <Button colorScheme='cyan' mr={3} onClick={handleSave}>
                    Save
                </Button>
                <Button onClick={onClose}>Cancel</Button>
            </ModalFooter>
            </ModalContent>
        </Modal>
    )
})

export default React.memo(ComponentEditor)