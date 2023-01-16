import React,  { forwardRef, useEffect, useImperativeHandle, useRef, useState, useCallback } from "react"
import {
  Box,
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
  Input,
  useToast,
  Textarea,
  InputGroup,
  Image,
} from '@chakra-ui/react';

const ConfigureAppearance = forwardRef((props, ref) => {
    
    const { isOpen, onOpen, onClose } = useDisclosure()
    const toast = useToast()
    const [app, setApp] = useState('')
    const [data, setData] = useState({})

    useImperativeHandle(ref, () => ({
        open(id) {
            onOpen()
            setApp(id)
            fetchData(id)
        }
    }))

    const fetchData = (id) => {
        fetch(`http://localhost:5000/readFile?path=${id}/appearance.json`)
            .then(response => response.text())
            .then(responseText => {
                let code = JSON.parse(responseText)
                setData(code)
            })

    }

    const updateParam = (ev, param) => {
        let prev = {...data}
        prev[param] = param === 'icon' ? ev : ev.target.value
        setData(prev)
    }

    const handleSave = () => {
        fetch(`http://localhost:5000/writeFile`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: app + '/appearance.json',
                content: JSON.stringify(data, null, '\t')
            })
        })
        .then(response => response.json())
        .then(responseJson => {
            onClose()
            toast({
                title: 'Saved Configuration Successfully!',
                status: 'success',
                duration: 2000,
                isClosable: true,
            })
        })
    }


    return (
        <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose} size="5xl">
            <ModalOverlay bg='blackAlpha.300' backdropFilter='blur(10px) hue-rotate(90deg)' />
            <ModalContent bg="blackAlpha.700" height="80%">
            <ModalHeader color="cyan.300">Configure Appearance</ModalHeader>
            <ModalCloseButton color="#ababab" />
            <ModalBody pb={6} pt={6} height="100%" width="100%" borderRadius={10} overflow="hidden">
                <Box height="100%" pl={5} pr={5} overflow="auto">
                    <Text color="whiteAlpha.600" fontSize="sm" mb={2}>App Name</Text>
                    <Input  
                        placeholder="App Name" 
                        color="whiteAlpha.700" 
                        defaultValue={data?.name}
                        onChange={e => updateParam(e, 'name')}
                        colorScheme="cyan"
                        mb={4} />
                    <Text color="whiteAlpha.600" fontSize="sm" mb={2}>Short App Name</Text>
                    <Input  
                        placeholder="Short App Name" 
                        defaultValue={data?.shortName}
                        onChange={e => updateParam(e, 'shortName')}
                        color="whiteAlpha.700" 
                        colorScheme="cyan"
                        mb={4} />
                    <Text color="whiteAlpha.600" fontSize="sm" mb={2}>App Description</Text>
                    <Textarea 
                        placeholder="App Description" 
                        defaultValue={data?.description}
                        onChange={e => updateParam(e, 'description')}
                        color="whiteAlpha.700" 
                        colorScheme="cyan"
                        mb={4}></Textarea>
                    <Text color="whiteAlpha.600" fontSize="sm" mb={2}>App Icon</Text>
                    <InputGroup mb={4}>
                        <Input 
                            id="icon-picker"
                            type="file"
                            display="none"
                            accept="image/*"
                            onChange={ev => {
                                if(ev.target.files[0].size > 1048576) {
                                    toast({
                                        title: 'Icon size should not exceed 1MB',
                                        status: 'error',
                                        duration: 2000,
                                        isClosable: true,
                                    })
                                    document.getElementById('icon-picker').value = ''
                                } else {
                                    document.getElementById('icon-preview').src = URL.createObjectURL(ev.target.files[0])
                                    var reader = new FileReader()
                                    reader.onload = function(){
                                        updateParam(reader.result, 'icon')
                                    }
                                    reader.readAsDataURL(ev.target.files[0])
                                }
                            }}
                            mb={4}
                        />
                        <Button onClick={() => document.getElementById('icon-picker').click()} 
                            colorScheme="cyan" mt={1}>
                            Choose an Icon
                        </Button>
                        <Image id="icon-preview" src={data?.icon} height={50} width={50} borderRadius={8} ml={10} />
                    </InputGroup>
                    <Text color="whiteAlpha.600" fontSize="sm" mb={2}>Theme Color</Text>
                    <Input  
                        placeholder="Theme Color" 
                        defaultValue={data?.themeColor}
                        onChange={e => updateParam(e, 'themeColor')}
                        color="whiteAlpha.700" 
                        colorScheme="cyan"
                        mb={4} />
                    <Text color="whiteAlpha.600" fontSize="sm" mb={2}>Background Color</Text>
                    <Input  
                        placeholder="Background Color" 
                        defaultValue={data?.backgroundColor}
                        onChange={e => updateParam(e, 'backgroundColor')}
                        color="whiteAlpha.700" 
                        colorScheme="cyan"
                        mb={4} />
                    <Text color="whiteAlpha.600" fontSize="sm" mb={2}>Language</Text>
                    <Input  
                        placeholder="Language"
                        defaultValue={data?.lang}
                        onChange={e => updateParam(e, 'lang')} 
                        color="whiteAlpha.700" 
                        colorScheme="cyan"
                        mb={4} />
                    <Text color="whiteAlpha.600" fontSize="sm" mb={2}>Robots.txt</Text>
                    <Textarea 
                        placeholder="Robots.txt" 
                        defaultValue={data?.robotsTxt}
                        onChange={e => updateParam(e, 'robotsTxt')}
                        color="whiteAlpha.700" 
                        colorScheme="cyan"
                        mb={4}></Textarea>
                </Box>
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

export default React.memo(ConfigureAppearance)