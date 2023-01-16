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
} from '@chakra-ui/react';

const LibraryManager = forwardRef((props, ref) => {
    
    const { isOpen, onOpen, onClose } = useDisclosure()
    const toast = useToast()
    const [app, setApp] = useState('')
    const [packageCode, setPackageCode] = useState(``)
    const [currentLibs, setCurrentLibs] = useState([])
    const [libs, setLibs] = useState([])

    useImperativeHandle(ref, () => ({
        open(id) {
            onOpen()
            setApp(id)
            fetch(`http://localhost:5000/readFile?path=${id}/package.json`)
            .then(response => response.text())
            .then(responseText => {
                const code = JSON.parse(responseText)
                let dependencies = code.dependencies
                let libArr = []
                Object.keys(dependencies).forEach(el => libArr.push({ package: { name: el } }))
                setLibs(libArr)
                setCurrentLibs(Object.keys(dependencies))
                setPackageCode(code)
            })
            
        }
    }))

   const handleInput = (event) => {
      if (event.key === 'Enter') {
        let q = event.target.value
        fetch(`https://registry.npmjs.com/-/v1/search?text=${q}&size=20`)
          .then(response => response.json())
          .then(responseJson => {
              setLibs(responseJson.objects)
          })
      }
  }

  const handleInstallation = (name, isInstalled) => {
    if(isInstalled) {
      fetch(`http://localhost:5000/installModule?name=${name}`)
        .then((response) => response.json())
        .then(responseJson => {
          if(responseJson?.res === "success") {
            toast({
              title: 'Library successfully Installed',
              status: 'success',
              duration: 2000,
              isClosable: true,
            })
            const out = responseJson?.output
            const re = new RegExp(`${name}@([0-9.]+)`, "")
            out.replace(re, (m, $1) => {
              let code = {...packageCode}
              code.dependencies[name] = $1
              setPackageCode(code)
              fetch(`http://localhost:5000/writeFile?path=${app}/package.json&content=${encodeURIComponent(JSON.stringify(code))}`)
                .then(response => response.json())
                .then(responseJson => {
                  //console.log(responseJson)
                })
            })
          } else {
            toast({
              title: 'Something went wrong',
              status: 'error',
              duration: 2000,
              isClosable: true,
            })
          }
        })
    }
  }


    return (
        <Modal closeOnOverlayClick={false} isOpen={isOpen} onClose={onClose} size="5xl">
            <ModalOverlay bg='blackAlpha.300' backdropFilter='blur(10px) hue-rotate(90deg)' />
            <ModalContent bg="blackAlpha.700" height="80%">
            <ModalHeader color="cyan.300">Library Manager</ModalHeader>
            <ModalCloseButton color="#ababab" />
            <ModalBody pb={6} pt={6} height="100%" width="100%" borderRadius={10} overflow="hidden">
                <Input 
                    id="search-lib-input"
                    placeholder="Search Libraries"
                    variant="flushed"
                    colorScheme="cyan"
                    color="whiteAlpha.700"
                    onKeyDown={handleInput}
                />
                <Box height="90%" overflow="auto">
                    {libs.map((item) => (
                        <Grid templateColumns='repeat(4, 1fr)' gap={5} mt={5} key={item?.name} alignItems="center">
                            <GridItem colSpan={3}>
                                <Text color="whiteAlpha.800">{item?.package?.name}</Text>
                                <Text color="whiteAlpha.400" fontSize="sm">{item?.package?.description}</Text>
                            </GridItem>
                            <GridItem width="100%" colSpan={1} justifyContent="center" alignItems="center">
                                <Button variant="outline" colorScheme="cyan" alignSelf="flex-end" 
                                  onClick={() => handleInstallation(item?.package?.name, currentLibs.includes(item?.package?.name))}>
                                    {currentLibs.includes(item?.package?.name) ? 'Remove' :  'Add'}
                                </Button>
                            </GridItem>
                        </Grid>
                    ))}
                </Box>
            </ModalBody>

            <ModalFooter>
                <Button onClick={onClose}>Cancel</Button>
            </ModalFooter>
            </ModalContent>
        </Modal>
    )
})

export default React.memo(LibraryManager)